import {loggerService} from '../../server.ts';
import WSResource from "./WSResource.ts";
import {
    AdminSocketChannel,
    IAdminRoomInfo,
    IAdminSocketConnectResponse,
    IAdminSocketDeletePlayerRequest,
    IAdminSocketMessage
} from "../../model/AdminSocketModel.ts";
import {getRoomList} from "../../core/RoomManager.ts";
import {broadcastMessage, getSocketsCount} from "./GameSocketResource.ts";
import {z} from "https://deno.land/x/zod@v3.11.6/index.ts";
import {
    GameSocketChannel,
    IDataDrawResponse,
    ISocketMessageRequest,
    ISocketMessageResponse,
    SocketUser
} from "../../model/GameSocketModel.ts";
import {IDraw} from "../../model/GameModel.ts";

const DataDeletePlayerSchema: z.ZodSchema<IAdminSocketDeletePlayerRequest> = z.object({
    playerId: z.string()
});

const AdminSocketMessageRequestSchema: z.ZodSchema<IAdminSocketMessage> = z.object({
    channel: z.nativeEnum(AdminSocketChannel),
    data: DataDeletePlayerSchema.optional()
});

export default class AdminSocketResource extends WSResource {

    constructor() {
        super({
            token: Deno.env.get("WEBSOCKET_ADMIN_TOKEN"),
            paths: ["/adminws"]
        });
    }

    protected addEventHandlers(socket: WebSocket): void {
        try {
            socket.onopen = () => {
                loggerService.debug(`WebSocket Admin - Connection opened`);
                sendGlobalData(socket);
            };

            socket.onmessage = (e: MessageEvent) => {
                this.safeOnSocketMessage(socket, () => {
                    const jsonRequest = AdminSocketMessageRequestSchema.parse(JSON.parse(e.data));
                    handleAdminSocketMessage(socket, jsonRequest);
                }, safeSend);
            };

            socket.onclose = () => {
                loggerService.debug(`WebSocket Admin - Connection closed`);
            };

            socket.onerror = (e: Event | ErrorEvent) => {
                loggerService.error(`WebSocket Admin - Error handled: ${
                    JSON.stringify(this.getErrorToPrint(e), null, 2)
                }`);
            };
        } catch (error) {
            loggerService.error(`WebSocket Admin - Error: ${
                JSON.stringify(error.stack, null, 2)
            }`);
        }
    }
}

function handleAdminSocketMessage(socket: WebSocket, message: IAdminSocketMessage) {
    const channel: AdminSocketChannel = message.channel;
    try {
        loggerService.debug(`WebSocket Admin - Handle channel (${channel})`);

        switch (channel) {
            case AdminSocketChannel.GLOBAL_DATA: {
                sendGlobalData(socket);
                break;
            }
            case AdminSocketChannel.DELETE_PLAYER: {
                onDeletePlayerMessage(socket, message);
                break;
            }
            default: {
                loggerService.debug(`WebSocket Admin - Invalid channel (${channel})`);
                safeSend(socket, JSON.stringify({error: "Invalid channel"}));
                break;
            }
        }
    } catch (error) {
        let errorResponse: z.ZodIssue[] | string;

        if (error instanceof z.ZodError) {
            errorResponse = error.issues;
        } else {
            errorResponse = error.message;
        }

        safeSend(socket, JSON.stringify({error: errorResponse}));
    }
}

function sendGlobalData(socket: WebSocket) {
    const roomList: IAdminRoomInfo[] = getRoomList().map(room => {
        return {
            roomId: room.roomId,
            playerList: room.players,
            drawCount: room.round.draws.length
        }
    });

    const drawCount: number = roomList.map(r => r.drawCount).reduce((a: number, b: number) => a + b, 0);

    const connectResponse: IAdminSocketConnectResponse = {
        channel: AdminSocketChannel.GLOBAL_DATA,
        data: {
            roomCount: roomList.length,
            wsCount: getSocketsCount(),
            drawCount: drawCount,
            roomList: roomList
        }
    };

    safeSend(socket, JSON.stringify(connectResponse));
}

function onDeletePlayerMessage(socketUser: SocketUser, message: ISocketMessageRequest) {
    const drawMessage: IDraw = DataDrawRequestSchema.parse(message.data);
    const drawMessageEnhance: IDataDrawResponse = {...drawMessage, draftsman: player};

    const responseDraw: ISocketMessageResponse = {
        channel: GameSocketChannel.DRAW,
        data: drawMessageEnhance
    };

    room.round.addDraw(drawMessage);
    broadcastMessage(room, JSON.stringify(responseDraw), [socketUser.socketUUID]);
}

function safeSend(socket: WebSocket, message: string) {
    try {
        socket.send(message);
    } catch (error) {
        loggerService.error(`WebSocket Admin - ${error.stack} `);
    }
}
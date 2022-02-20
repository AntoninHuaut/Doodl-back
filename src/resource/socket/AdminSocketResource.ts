import {loggerService} from '../../server.ts';
import WSResource from "./WSResource.ts";
import {
    AdminSocketChannel,
    IAdminRoomInfo,
    IAdminSocketConnectResponse,
    IAdminSocketDeletePlayerRequest,
    IAdminSocketDeleteRoomRequest,
    IAdminSocketMessage,
    IAdminSocketMessageRequest
} from "../../model/AdminSocketModel.ts";
import {getRoomById, getRoomList} from "../../core/RoomManager.ts";
import {getSocketsCount, kickPlayer} from "./GameSocketResource.ts";
import {z} from "https://deno.land/x/zod@v3.11.6/index.ts";
import {IErrorSocketMessageResponse} from "../../model/GlobalSocketModel.ts";
import {deletePlayer} from "../../core/PlayerManager.ts";
import {deleteRoom} from "../../core/RoomManager.ts";

const DataDeletePlayerSchema: z.ZodSchema<IAdminSocketDeletePlayerRequest> = z.object({
    playerId: z.string(),
    roomId: z.string()
});

const DataDeleteRoomShema: z.ZodSchema<IAdminSocketDeleteRoomRequest> = z/object({
    roomId: z.string()
})

const AdminSocketMessageRequestSchema: z.ZodSchema<IAdminSocketMessageRequest> = z.object({
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
                this.safeOnSocketMessage(socket, e.data, () => {
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

function handleAdminSocketMessage(socket: WebSocket, message: IAdminSocketMessageRequest) {
    const channel: AdminSocketChannel = message.channel;
    try {
        loggerService.debug(`WebSocket Admin - Handle channel (${channel})`);

        switch (channel) {
            case AdminSocketChannel.GLOBAL_DATA: {
                sendGlobalData(socket);
                break;
            }
            case AdminSocketChannel.SUPPRESS_ROOM: {
                onDeleteRoomMessage(socket, message);
                break;
            }
            case AdminSocketChannel.KICK_PLAYER: {
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

        const errorObj: IErrorSocketMessageResponse = {channel: channel, error: errorResponse};
        safeSend(socket, JSON.stringify(errorObj));
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

function onDeletePlayerMessage(socket: WebSocket, message: IAdminSocketMessageRequest) {
    const deletePlayerRequest: IAdminSocketDeletePlayerRequest = DataDeletePlayerSchema.parse(message.data);
    const playerId = deletePlayerRequest.playerId;

    deletePlayer(playerId, deletePlayerRequest.roomId);
    kickPlayer(playerId, "You have been excluded");
    const kickResponse: IAdminSocketMessage = {
        channel: AdminSocketChannel.KICK_PLAYER
    };

    safeSend(socket, JSON.stringify(kickResponse));
}

function onDeleteRoomMessage(socket: WebSocket, message: IAdminSocketMessageRequest) {
    const deleteRoomRequest: IAdminSocketDeleteRoomRequest = DataDeleteRoomShema.parse(message.data);
    const roomId = deleteRoomRequest.roomId;
    deleteRoom(getRoomById(roomId));
    const deleteRoomResponse: IAdminSocketMessage = {
        channel: AdminSocketChannel.SUPPRESS_ROOM
    }
    safeSend(socket, JSON.stringify(deleteRoomResponse));
}

function safeSend(socket: WebSocket, message: string) {
    try {
        socket.send(message);
    } catch (error) {
        loggerService.error(`WebSocket Admin - ${error.stack} `);
    }
}
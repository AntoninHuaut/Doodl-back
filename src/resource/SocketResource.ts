import { Drash, z } from "../deps.ts";
import { ISocketMessageRequest, SocketChannel, IDataInitRequest, IDataChatRequest, ISocketMessageResponse, SocketUser } from '../model/SocketModel.ts';
import { loggerService } from '../server.ts';
import { createPlayer, deletePlayer } from '../core/PlayerManager.ts';
import { getRoomById } from '../core/RoomManager.ts';
import { Room } from '../model/Room.ts';
import InvalidParameterValue from '../model/exception/InvalidParameterValue.ts';
import SocketInitNotPerformed from '../model/exception/SocketInitNotPerformed.ts';
import { getValidChatMessage } from '../core/validator/ChatMessageValidator.ts';
import { IMessage, DrawTool, IPlayer, IDraw } from '../model/GameModel.ts';
import { isPlayerCanDraw } from '../core/validator/DrawValidator.ts';
import InvalidPermission from '../model/exception/InvalidPermission.ts';

const DataInitRequestSchema: z.ZodSchema<IDataInitRequest> = z.object({
    roomId: z.string(),
    name: z.string(),
    imgUrl: z.string()
});
const DataChatRequestSchema: z.ZodSchema<IDataChatRequest> = z.object({
    message: z.string()
});
const DataDrawSchema: z.ZodSchema<IDraw> = z.object({
    tool: z.nativeEnum(DrawTool),
    coords: z.object({
        x: z.number(),
        y: z.number()
    }),
    color: z.string().optional(),
    lineWidth: z.number().optional()
});

const SocketMessageRequestSchema: z.ZodSchema<ISocketMessageRequest> = z.object({
    channel: z.nativeEnum(SocketChannel),
    data: DataInitRequestSchema.or(DataChatRequestSchema).or(DataDrawSchema)
});

const sockets = new Map<string, SocketUser>();

export default class SocketResource extends Drash.Resource {
    public paths = ["/ws"];

    public GET(request: Drash.Request, response: Drash.Response): void {
        if (request.headers.has("connection") && request.headers.has("upgrade") &&
            request.headers.get("connection")!.toLowerCase().includes("upgrade") &&
            request.headers.get("upgrade")!.toLowerCase() === "websocket") {
            try {
                const { socket, response: socketResponse } = Deno.upgradeWebSocket(request);
                this.#addEventHandlers(socket);
                return response.upgrade(socketResponse);
            } catch (error) {
                return response.text(error);
            }
        }

        return response.json({
            error: "Invalid headers"
        });
    }

    #addEventHandlers(socket: WebSocket): void {
        let socketUser: SocketUser | null;

        socket.onopen = () => {
            if (socketUser != null) return;

            socketUser = { socket: socket, socketUUID: crypto.randomUUID() };
            sockets.set(socketUser.socketUUID, socketUser);
            loggerService.debug(`WebSocket ${socketUser.socketUUID} - Connection opened`);
        };

        socket.onmessage = (e: MessageEvent) => {
            if (socketUser == null) return;

            try {
                const jsonRequest = SocketMessageRequestSchema.parse(JSON.parse(e.data));
                handleSocketMessage(socketUser, jsonRequest);
            } catch (error) {
                let errorResponse: z.ZodIssue[] | string;

                if (error instanceof z.ZodError) {
                    errorResponse = error.issues;
                } else {
                    errorResponse = error.name;
                }

                return safeSend(socketUser, JSON.stringify({ error: errorResponse }));
            }
        };

        socket.onclose = () => {
            if (socketUser == null) return;

            loggerService.debug(`WebSocket ${socketUser.socketUUID} - Connection closed`);
            deletePlayer(socketUser);
            loggerService.debug(`Removing socket (${socketUser.socketUUID})`);
            sockets.delete(socketUser.socketUUID);
            socketUser = null;
        };

        socket.onerror = (e: Event) => {
            if (socketUser == null) return;

            loggerService.error(`WebSocket ${socketUser.socketUUID} - WebSocket error: ${JSON.stringify(e, null, 2)}`);
        };
    }
}

function handleSocketMessage(socketUser: SocketUser, message: ISocketMessageRequest) {
    const channel: SocketChannel = message.channel;
    try {
        switch (channel) {
            case SocketChannel.INIT: {
                loggerService.debug(`WebSocket (${socketUser.socketUUID}) - Handle channel (${SocketChannel.INIT})`);
                onMessageInitChannel(socketUser, message);
                break;
            }
            case SocketChannel.CHAT: {
                loggerService.debug(`WebSocket (${socketUser.socketUUID}) - Handle channel (${SocketChannel.CHAT})`);
                onMessageChatChannel(socketUser, message);
                break;
            }
            case SocketChannel.DRAW: {
                loggerService.debug(`WebSocket (${socketUser.socketUUID}) - Handle channel (${SocketChannel.DRAW})`);
                onMessageDrawChannel(socketUser, message);
                break;
            }
            default: {
                loggerService.debug(`WebSocket (${socketUser.socketUUID}) - Invalid channel (${channel})`);
                safeSend(socketUser, JSON.stringify({ error: "Invalid channel" }));
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

        safeSend(socketUser, JSON.stringify({ error: errorResponse }));
    }
}

function onMessageInitChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const socketUUID = socketUser.socketUUID;
    const initMessage: IDataInitRequest = DataInitRequestSchema.parse(message.data);

    const room: Room | undefined = getRoomById(initMessage.roomId);
    if (room == null) throw new InvalidParameterValue("Invalid roomId");

    socketUser.player = createPlayer(socketUser, initMessage);
    socketUser.roomId = room.roomId;

    const responseInitMessage: ISocketMessageResponse = {
        channel: SocketChannel.INIT,
        data: {
            playerId: socketUUID,
            messages: room.messages,
            draws: room.round.draws
        }
    };
    safeSend(socketUser, JSON.stringify(responseInitMessage));
}

function onMessageChatChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const [player, room] = checkInitAndGetRoom(socketUser);
    const chatMessage: IDataChatRequest = DataChatRequestSchema.parse(message.data);

    room.round.handleChatMessage(chatMessage, () => {
        const chatResponse: IMessage | undefined = getValidChatMessage(player, chatMessage.message);
        if (!chatResponse) return;

        const responseChatMessage: ISocketMessageResponse = {
            channel: SocketChannel.CHAT,
            data: chatResponse
        };

        room.addMessage(chatResponse);
        room.getPlayersId().forEach(otherPlayerId => {
            const otherSocketUser = sockets.get(otherPlayerId);
            if (otherSocketUser != null) {
                safeSend(otherSocketUser, JSON.stringify(responseChatMessage));
            }
        });
    });
}

function onMessageDrawChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const [player, room] = checkInitAndGetRoom(socketUser);
    if (!isPlayerCanDraw(player, room)) throw new InvalidPermission("You don't have the permission to draw");
    const drawMessage: IDraw = DataDrawSchema.parse(message.data);

    const responseDrawMessage: ISocketMessageResponse = {
        channel: SocketChannel.DRAW,
        data: drawMessage
    };

    room.round.addDraw(drawMessage);
    room.getPlayersId().forEach(otherPlayerId => {
        const otherSocketUser = sockets.get(otherPlayerId);
        if (otherSocketUser != null) {
            safeSend(otherSocketUser, JSON.stringify(responseDrawMessage));
        }
    });
}

function checkInitAndGetRoom(socketUser: SocketUser): [IPlayer, Room] {
    const roomId = socketUser.roomId;
    const player = socketUser.player;
    if (roomId == null || player == null) throw new SocketInitNotPerformed();
    const room: Room | undefined = getRoomById(roomId);
    if (room == null) throw new InvalidParameterValue("Invalid roomId");

    return [player, room];
}

function safeSend(socketUser: SocketUser, message: string) {
    try {
        socketUser.socket.send(message);
    } catch (error) {
        loggerService.error(`WebSocket ${socketUser.socketUUID ?? '??'} - ${error.stack} `);
    }
}
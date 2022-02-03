import { Drash, z } from "../deps.ts";
import { ISocketMessageRequest, SocketChannel, IDataInitRequest, IDataChatRequest } from '../model/SocketModel.ts';
import AuthentificationException from '../model/exception/AuthentificationException.ts';
import { loggerService } from '../server.ts';
import { createPlayer } from '../core/PlayerManager.ts';
import { getRoomById, removePlayerIdToRoom } from '../core/RoomManager.ts';
import { Room } from '../model/Room.ts';

const DataInitRequestSchema: z.ZodSchema<IDataInitRequest> = z.object({
    roomId: z.string(),
    name: z.string(),
    imgUrl: z.string()
});
const DataChatRequestSchema: z.ZodSchema<IDataChatRequest> = z.object({
    message: z.string()
});

const SocketMessageRequestSchema: z.ZodSchema<ISocketMessageRequest> = z.object({
    channel: z.nativeEnum(SocketChannel),
    data: DataInitRequestSchema.or(DataChatRequestSchema)
});

interface SocketUser {
    socket: WebSocket;
    roomId?: string;
}

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
        let socketUUID: string | null = null;

        socket.onopen = () => {
            socketUUID = crypto.randomUUID();
            sockets.set(socketUUID, { socket: socket });
            loggerService.debug(`WebSocket ${socketUUID} - Connection opened`);
        };

        socket.onmessage = (e: MessageEvent) => {
            try {
                if (!socketUUID) throw new AuthentificationException("Invalid UUID");

                const jsonRequest = SocketMessageRequestSchema.parse(JSON.parse(e.data));
                handleSocketMessage(socketUUID, jsonRequest);
            } catch (error) {
                let errorResponse: z.ZodIssue[] | string;

                if (error instanceof z.ZodError) {
                    errorResponse = error.issues;
                } else {
                    errorResponse = error.name;
                }

                return safeSend(socketUUID, JSON.stringify({ error: errorResponse }));
            }
        };

        socket.onclose = () => {
            loggerService.debug(`WebSocket ${socketUUID} - Connection closed`);
            if (socketUUID != null) {
                const room: Room | undefined = getRoomById(sockets.get(socketUUID)?.roomId);
                if (room != null) {
                    removePlayerIdToRoom(socketUUID, room);
                }
                loggerService.debug(`Removing socket (${socketUUID})`);
                sockets.delete(socketUUID);
                socketUUID = null;
            }
        };

        socket.onerror = (e: Event) => {
            loggerService.error(`WebSocket ${socketUUID} - WebSocket error: ${JSON.stringify(e, null, 2)}`);
        };
    }
}

function handleSocketMessage(socketUUID: string, message: ISocketMessageRequest) {
    const channel: SocketChannel = message.channel;
    try {
        const socketUser = sockets.get(socketUUID);
        if (socketUser == null) throw new AuthentificationException("Invalid UUID");

        switch (channel) {
            case SocketChannel.INIT: {
                const initMessage: IDataInitRequest = DataInitRequestSchema.parse(message.data);
                createPlayer(socketUUID, initMessage);
                socketUser.roomId = initMessage.roomId;

                safeSend(socketUUID, JSON.stringify({ success: true }));
                break;
            }
            case SocketChannel.CHAT: {
                break;
            }
            case SocketChannel.DRAW: {
                break;
            }
            default: {
                safeSend(socketUUID, JSON.stringify({ error: "Invalid channel" }));
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

        safeSend(socketUUID, JSON.stringify({ error: errorResponse }));
    }
}

function safeSend(socketUUID: string | null, message: string) {
    try {
        if (!socketUUID) throw new AuthentificationException("Invalid UUID");

        sockets.get(socketUUID)?.socket.send(message);
    } catch (error) {
        loggerService.error(`WebSocket ${socketUUID ?? '??'} - ${error.stack}`);
    }
}
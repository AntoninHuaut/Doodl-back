import {z} from "../../deps.ts";
import {
    IDataChatRequest,
    IDataDrawResponse,
    IDataInitRequest,
    ISocketMessageRequest,
    ISocketMessageResponse,
    GameSocketChannel,
    SocketUser
} from '../../model/GameSocketModel.ts';
import {loggerService} from '../../server.ts';
import {createPlayer, deletePlayer} from '../../core/PlayerManager.ts';
import {getRoomById, startGame} from '../../core/RoomManager.ts';
import {Room} from '../../model/Room.ts';
import InvalidParameterValue from '../../model/exception/InvalidParameterValue.ts';
import SocketInitNotPerformed from '../../model/exception/SocketInitNotPerformed.ts';
import {getValidChatMessage} from '../../core/validator/ChatMessageValidator.ts';
import {
    DrawTool,
    GameMode,
    ICoordinate,
    IDraw,
    IMessage,
    IPlayer,
    IRoomConfig,
    RoomState
} from '../../model/GameModel.ts';
import {isPlayerCanDraw} from '../../core/validator/DrawValidator.ts';
import InvalidPermission from '../../model/exception/InvalidPermission.ts';
import {appRoomConfig} from '../../config.ts';
import InvalidState from "../../model/exception/InvalidState.ts";
import WSResource from "./WSResource.ts";

const DataInitRequestSchema: z.ZodSchema<IDataInitRequest> = z.object({
    roomId: z.string(),
    name: z.string(),
    imgUrl: z.string()
});
const DataChatRequestSchema: z.ZodSchema<IDataChatRequest> = z.object({
    message: z.string()
});
const DataCoordinateSchema: z.ZodSchema<ICoordinate> = z.object({
    x: z.number(),
    y: z.number()
});
const DataDrawRequestSchema: z.ZodSchema<IDraw> = z.object({
    tool: z.nativeEnum(DrawTool),
    coordsTo: DataCoordinateSchema.optional(),
    coordsFrom: DataCoordinateSchema.optional(),
    color: z.string().optional(),
    lineWidth: z.number().optional()
});
const DataStartRequestSchema: z.ZodSchema<IRoomConfig> = z.object({
    gameMode: z.nativeEnum(GameMode),
    timeByTurn: z.number().min(appRoomConfig.minTimeByTurn).max(appRoomConfig.maxTimeByTurn),
    maxPlayer: z.number().min(appRoomConfig.minMaxPlayer).max(appRoomConfig.maxMaxPlayer)
});

const SocketMessageRequestSchema: z.ZodSchema<ISocketMessageRequest> = z.object({
    channel: z.nativeEnum(GameSocketChannel),
    data: DataInitRequestSchema.or(DataChatRequestSchema).or(DataDrawRequestSchema).or(DataStartRequestSchema).optional()
});

const sockets = new Map<string, SocketUser>();

export function getSocketsCount(): number {
    return sockets.size;
}

export default class GameSocketResource extends WSResource {

    constructor() {
        super({
            paths: ["/ws"]
        });
    }

    protected addEventHandlers(socket: WebSocket): void {
        const socketUUID: string = crypto.randomUUID();

        try {
            socket.onopen = () => {
                if (sockets.has(socketUUID)) return;

                const socketUser = {socket: socket, socketUUID: socketUUID};
                sockets.set(socketUUID, socketUser);
                loggerService.debug(`WebSocket ${socketUser.socketUUID} - Connection opened`);
            };

            socket.onmessage = (e: MessageEvent) => {
                const socketUser: SocketUser | undefined = sockets.get(socketUUID);
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

                    return safeSend(socketUser, JSON.stringify({error: errorResponse}));
                }
            };

            socket.onclose = () => {
                const socketUser: SocketUser | undefined = sockets.get(socketUUID);
                if (socketUser == null) return;

                loggerService.debug(`WebSocket ${socketUser.socketUUID} - Connection closed`);
                deletePlayer(socketUser);
                loggerService.debug(`Removing socket (${socketUser.socketUUID})`);
                sockets.delete(socketUser.socketUUID);
            };

            socket.onerror = (e: Event | ErrorEvent) => {
                const socketUser: SocketUser | undefined = sockets.get(socketUUID);
                if (socketUser == null) return;

                const errorStack = e instanceof ErrorEvent ? {
                    message: e.message ?? "Unknown message",
                    filename: e.filename ?? "Unknown filename",
                    lineno: e.lineno ?? "Unknown lineno",
                    colno: e.colno ?? "Unknown colno",
                    error: e.error ?? "Unknown error",
                    stack: e.error?.stack ?? "Unknown error.stack"
                } : e;
                loggerService.error(`WebSocket ${socketUser.socketUUID} - WebSocket error: ${
                    JSON.stringify(errorStack, null, 2)
                }`);
            }
        } catch (error) {
            loggerService.error(`WIP WebSocket ${socketUUID ?? 'Unknown'} - Error: ${
                JSON.stringify(error.stack, null, 2)
            }`);
        }
    }
}

function handleSocketMessage(socketUser: SocketUser, message: ISocketMessageRequest) {
    const channel: GameSocketChannel = message.channel;
    try {
        loggerService.debug(`WebSocket (${socketUser.socketUUID}) - Handle channel (${channel})`);

        switch (channel) {
            case GameSocketChannel.PING: {
                safeSend(socketUser, JSON.stringify({channel: GameSocketChannel.PONG}));
                break;
            }
            case GameSocketChannel.PONG: {
                break;
            }
            case GameSocketChannel.INIT: {
                onMessageInitChannel(socketUser, message);
                break;
            }
            case GameSocketChannel.CHAT: {
                onMessageChatChannel(socketUser, message);
                break;
            }
            case GameSocketChannel.DRAW: {
                onMessageDrawChannel(socketUser, message);
                break;
            }
            case GameSocketChannel.INFO: {
                onMessageInfoChannel(socketUser, message);
                break;
            }
            case GameSocketChannel.START: {
                onMessageStartChannel(socketUser, message);
                break;
            }
            default: {
                loggerService.debug(`WebSocket (${socketUser.socketUUID}) - Invalid channel (${channel})`);
                safeSend(socketUser, JSON.stringify({error: "Invalid channel"}));
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

        safeSend(socketUser, JSON.stringify({error: errorResponse}));
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
        channel: GameSocketChannel.INIT,
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
            channel: GameSocketChannel.CHAT,
            data: chatResponse
        };

        room.addMessage(chatResponse);
        room.playersId.forEach((otherPlayerId: string) => {
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

    const drawMessage: IDraw = DataDrawRequestSchema.parse(message.data);
    const drawMessageEnhance: IDataDrawResponse = {...drawMessage, draftsman: player};

    const responseDraw: ISocketMessageResponse = {
        channel: GameSocketChannel.DRAW,
        data: drawMessageEnhance
    };

    room.round.addDraw(drawMessage);
    room.playersId.forEach((otherPlayerId: string) => {
        if (otherPlayerId == socketUser.socketUUID) return;

        const otherSocketUser = sockets.get(otherPlayerId);
        if (otherSocketUser != null) {
            safeSend(otherSocketUser, JSON.stringify(responseDraw));
        }
    });
}

function onMessageInfoChannel(socketUser: SocketUser, _message: ISocketMessageRequest) {
    const [, room] = checkInitAndGetRoom(socketUser);
    const responseInfo: ISocketMessageResponse = {
        channel: GameSocketChannel.INFO,
        data: {
            roomState: room.state,
            playerList: room.players,
            roomConfig: room.config
        }
    };

    safeSend(socketUser, JSON.stringify(responseInfo));
}

function onMessageStartChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const [player, room] = checkInitAndGetRoom(socketUser);
    if (!room.isPlayerAdmin(player)) throw new InvalidPermission("You don't have the permission to start the room");
    if (room.state !== RoomState.LOBBY) throw new InvalidState("The room must be in the LOBBY state");

    const roomConfig: IRoomConfig = DataStartRequestSchema.parse(message.data);
    room.config = roomConfig;

    const responseStart: ISocketMessageResponse = {
        channel: GameSocketChannel.START,
        data: roomConfig
    };

    startGame(room);
    safeSend(socketUser, JSON.stringify(responseStart));
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
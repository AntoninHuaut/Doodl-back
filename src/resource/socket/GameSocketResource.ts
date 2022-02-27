import {z} from "../../deps.ts";
import {
    GameSocketChannel,
    IDataChatRequest,
    IDataChooseWordRequest,
    IDataChooseWordResponse,
    IDataDrawResponse,
    IDataInfoResponse,
    IDataInitRequest,
    IDataKickResponse,
    ISocketMessageRequest,
    ISocketMessageResponse,
    SocketUser
} from '../../model/GameSocketModel.ts';
import {loggerService} from '../../server.ts';
import {createPlayer, deletePlayer} from '../../core/PlayerManager.ts';
import {checkIfRoomAvailableValide, createRoomWithId, getRoomById, startGame} from '../../core/RoomManager.ts';
import {Room} from '../../core/Room.ts';
import InvalidParameterValue from '../../model/exception/InvalidParameterValue.ts';
import SocketInitNotPerformed from '../../model/exception/SocketInitNotPerformed.ts';
import {
    DrawTool,
    GameMode,
    ICoordinate,
    IDraw,
    IPlayer,
    IRoomConfig,
    RoomState,
    WordList
} from '../../model/GameModel.ts';
import {isPlayerCanDraw} from '../../core/validator/DrawValidator.ts';
import InvalidPermission from '../../model/exception/InvalidPermission.ts';
import {appRoomConfig} from '../../config.ts';
import InvalidState from "../../model/exception/InvalidState.ts";
import WSResource from "./WSResource.ts";
import {IErrorSocketMessageResponse} from "../../model/GlobalSocketModel.ts";
import CycleRound from "../../core/round/CycleRound.ts";

const DataInitRequestSchema: z.ZodSchema<IDataInitRequest> = z.object({
    roomId: z.string(),
    name: z.string().min(appRoomConfig.minPlayerNameLength).max(appRoomConfig.maxPlayerNameLength),
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
const DataConfigRequestSchema: z.ZodSchema<IRoomConfig> = z.object({
    gameMode: z.nativeEnum(GameMode),
    timeByTurn: z.number().min(appRoomConfig.minTimeByTurn).max(appRoomConfig.maxTimeByTurn),
    cycleRoundByGame: z.number().min(appRoomConfig.minCycleRoundByGame).max(appRoomConfig.maxCycleRoundByGame),
    wordList: z.nativeEnum(WordList)
});
const DataChooseWordRequestSchema: z.ZodSchema<IDataChooseWordRequest> = z.object({
    word: z.string()
});

const SocketMessageRequestSchema: z.ZodSchema<ISocketMessageRequest> = z.object({
    channel: z.nativeEnum(GameSocketChannel),
    data: DataInitRequestSchema.or(DataChatRequestSchema).or(DataDrawRequestSchema)
        .or(DataConfigRequestSchema).or(DataChooseWordRequestSchema).optional()
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

                this.safeOnSocketMessage(socketUser, e.data, () => {
                    const jsonRequest = SocketMessageRequestSchema.parse(JSON.parse(e.data));
                    handleSocketMessage(socketUser, jsonRequest);
                }, safeSend);
            };

            socket.onclose = () => {
                try {
                    const socketUser: SocketUser | undefined = sockets.get(socketUUID);
                    if (socketUser == null) return;

                    sockets.delete(socketUser.socketUUID);
                    deletePlayer(socketUser.socketUUID, socketUser.roomId);

                    checkIfRoomAvailableValide(socketUser.roomId);

                    const room = getRoomById(socketUser.roomId);
                    if (room) {
                        sendIDataInfoResponse(room);
                    }
                } catch (err) {
                    loggerService.error(`[1] WebSocket - WebSocket error: ${
                        JSON.stringify(this.getErrorToPrint(err), null, 2)
                    }`);
                }
            };

            socket.onerror = (e: Event | ErrorEvent) => {
                try {
                    const socketUser: SocketUser | undefined = sockets.get(socketUUID);
                    if (socketUser == null) return;

                    loggerService.error(`WebSocket ${socketUser.socketUUID} - WebSocket error: ${
                        JSON.stringify(this.getErrorToPrint(e), null, 2)
                    }`);
                } catch (err) {
                    loggerService.error(`[2] WebSocket - WebSocket error: ${
                        JSON.stringify(this.getErrorToPrint(err), null, 2)
                    }`);
                }
            }
        } catch (error) {
            loggerService.error(`WebSocket ${socketUUID ?? 'Unknown'} - Error: ${
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
                onMessageInfoChannel(socketUser);
                break;
            }
            case GameSocketChannel.CONFIG: {
                onMessageConfigChannel(socketUser, message);
                break;
            }
            case GameSocketChannel.CHOOSE_WORD: {
                onMessageChooseWordChannel(socketUser, message);
                break;
            }
            case GameSocketChannel.START: {
                onMessageStartChannel(socketUser);
                break;
            }
            case GameSocketChannel.GUESS:
            case GameSocketChannel.PONG: {
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

        const errorObj: IErrorSocketMessageResponse = {channel: channel, error: errorResponse};
        safeSend(socketUser, JSON.stringify(errorObj));
    }
}

function onMessageInitChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const socketUUID = socketUser.socketUUID;
    const initMessage: IDataInitRequest = DataInitRequestSchema.parse(message.data);

    let room: Room | undefined = getRoomById(initMessage.roomId);
    if (room == null) {
        room = createRoomWithId(initMessage.roomId);
    }

    socketUser.player = createPlayer(socketUser, initMessage);
    socketUser.roomId = room.roomId;

    const responseInitMessage: ISocketMessageResponse = {
        channel: GameSocketChannel.INIT,
        data: {
            playerId: socketUUID,
            messages: room.messages.filter(m => !m.isSpectator),
            draws: room.round.draws
        }
    };

    safeSend(socketUser, JSON.stringify(responseInitMessage));
    sendIDataInfoResponse(room);

    if (room.isInGame()) {
        sendGuessData(room);
    }
}

function onMessageChatChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const [player, room] = checkInitAndGetRoom(socketUser);
    const chatMessage: IDataChatRequest = DataChatRequestSchema.parse(message.data);

    room.round.handleChatMessage(player, chatMessage);
}

function onMessageDrawChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const [player, room] = checkInitAndGetRoom(socketUser);
    if (!isPlayerCanDraw(player, room)) throw new InvalidPermission("You don't have the permission to draw");
    if (room.state !== RoomState.DRAWING) throw new InvalidState("The room must be in the DRAWING state");

    const drawMessage: IDraw = DataDrawRequestSchema.parse(message.data);
    const drawMessageEnhance: IDataDrawResponse = {...drawMessage, draftsman: player};

    const responseDraw: ISocketMessageResponse = {
        channel: GameSocketChannel.DRAW,
        data: drawMessageEnhance
    };

    room.round.addDraw(drawMessage);
    broadcastMessage(room, JSON.stringify(responseDraw), [socketUser.socketUUID]);
}

function onMessageInfoChannel(socketUser: SocketUser) {
    const [, room] = checkInitAndGetRoom(socketUser);
    sendIDataInfoResponse(room);
}

function onMessageConfigChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const [player, room] = checkInitAndGetRoom(socketUser);
    if (!room.isPlayerAdmin(player)) throw new InvalidPermission("You don't have the permission to start the room");
    if (room.state !== RoomState.LOBBY) throw new InvalidState("The room must be in the LOBBY state");

    room.setRoomConfig(DataConfigRequestSchema.parse(message.data));

    const responseConfig: ISocketMessageResponse = {
        channel: GameSocketChannel.CONFIG,
        data: room.roomConfig
    };

    broadcastMessage(room, JSON.stringify(responseConfig));
}

async function onMessageStartChannel(socketUser: SocketUser) {
    const [player, room] = checkInitAndGetRoom(socketUser);
    if (!room.isPlayerAdmin(player)) throw new InvalidPermission("You don't have the permission to start the room");
    if (room.state !== RoomState.LOBBY) throw new InvalidState("The room must be in the LOBBY state");
    if (room.players.length < 2) throw new InvalidState("Invalid minimum number of players");

    const responseStart: ISocketMessageResponse = {
        channel: GameSocketChannel.START,
        data: room.roomConfig
    };

    await startGame(room);

    safeSend(socketUser, JSON.stringify(responseStart));
    sendIDataInfoResponse(room);
}

function onMessageChooseWordChannel(socketUser: SocketUser, message: ISocketMessageRequest) {
    const [, room] = checkInitAndGetRoom(socketUser);
    if (room.state !== RoomState.CHOOSE_WORD) throw new InvalidState("The room must be in the CHOOSE_WORD state");

    const word: string = DataChooseWordRequestSchema.parse(message.data).word;
    room.round.setUserChooseWord(word);
}

function checkInitAndGetRoom(socketUser: SocketUser): [IPlayer, Room] {
    const roomId = socketUser.roomId;
    const player = socketUser.player;
    if (roomId == null || player == null) throw new SocketInitNotPerformed();
    const room: Room | undefined = getRoomById(roomId);
    if (room == null) throw new InvalidParameterValue("Invalid roomId");

    return [player, room];
}

export function broadcastMessage(room: Room, message: string, ignorePlayersId: string[] = []) {
    room.players.forEach((otherPlayer: IPlayer) => {
        const otherPlayerId = otherPlayer.playerId;
        if (ignorePlayersId.includes(otherPlayerId)) return;

        const otherSocketUser = sockets.get(otherPlayerId);
        if (otherSocketUser != null) {
            safeSend(otherSocketUser, message);
        }
    });
}

export function sendAskChooseWordMessage(round: CycleRound) {
    const askChooseWord: IDataChooseWordResponse = {
        words: round.possibleWords
    };

    round.playerTurn.forEach(player => {
        const socketUser: SocketUser | undefined = sockets.get(player.playerId);
        if (!socketUser) return;

        safeSend(socketUser, JSON.stringify({
            channel: GameSocketChannel.CHOOSE_WORD,
            data: askChooseWord
        }));
    });
}

function safeSend(socketUser: SocketUser, message: string) {
    try {
        socketUser.socket.send(message);
    } catch (_error) {
        // Ignore
    }
}

export function kickPlayer(playerId: string, reason: string | undefined) {
    const socketUser: SocketUser | undefined = sockets.get(playerId);
    if (!socketUser) return;

    loggerService.debug(`WebSocket ${socketUser.socketUUID} - KICK (reason: "${reason}")`);

    try {
        const socket = socketUser.socket;
        const kickResponse: IDataKickResponse = {
            reason: reason
        };

        safeSend(socketUser, JSON.stringify({
            channel: GameSocketChannel.KICK,
            data: kickResponse
        }));

        if (socket?.readyState === socket.OPEN) {
            socket.close();
        }
    } catch (_ex) {
        // Ignore
    }

    loggerService.debug(`Removing socket (${socketUser.socketUUID})`);
    sockets.delete(playerId);
}

export function sendGuessData(room: Room): void {
    broadcastMessage(room, JSON.stringify({
        channel: GameSocketChannel.GUESS,
        data: {
            playersGuess: room.round.playersGuess
        }
    }));
}

export function sendIDataInfoResponse(room: Room): void {
    room.players.forEach((player: IPlayer) => sendIDataInfoResponseToPlayer(player, room));
}

export function sendIDataInfoResponseToPlayer(player: IPlayer, room: Room): void {
    const infoResponse: IDataInfoResponse = {
        roomState: room.state,
        playerAdminId: room.playerAdminId,
        playerList: room.players,
        roomConfig: room.roomConfig
    };

    if (room.state !== RoomState.LOBBY) {
        const canHasRealWord = (room.state !== RoomState.DRAWING || room.round.hasGuessOrDrawer(player));
        const word = (canHasRealWord ? room.round.word : room.round.anonymeWord) ?? "";

        infoResponse.roundData = {
            delay: {
                endRound: CycleRound.DELAY_NEXT_ROUND,
                endGame: CycleRound.DELAY_END_GAME,
                drawTime: room.roomConfig.timeByTurn,
                chooseWord: CycleRound.DELAY_CHOOSE_WORD
            },
            dateStateStarted: room.round.dateStateStarted,
            word: word,
            roundCurrentCycle: room.round.roundCurrentCycle,
            playerTurn: room.round.playerTurn
        };
    }

    const dataToSend: ISocketMessageResponse = {
        channel: GameSocketChannel.INFO,
        data: infoResponse
    };

    const socketUser: SocketUser | undefined = sockets.get(player.playerId);
    if (!socketUser) return;

    safeSend(socketUser, JSON.stringify(dataToSend));
}

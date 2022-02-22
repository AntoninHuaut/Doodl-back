import {IDraw, IMessage, IPlayer, IRoomConfig, RoomState} from './GameModel.ts';

export interface SocketUser {
    socket: WebSocket;
    readonly socketUUID: string;
    player?: IPlayer;
    roomId?: string;
}

export interface ISocketMessage {
    channel: GameSocketChannel;
}

export interface ISocketMessageRequest extends ISocketMessage {
    data?: IDataInitRequest | IDataChatRequest | IDraw | IRoomConfig | IDataChooseWordRequest;
}

export interface ISocketMessageResponse extends ISocketMessage {
    data: IDataInitResponse | IMessage | IDataDrawResponse | IDataInfoResponse | IRoomConfig | IDataKickResponse | IDataChooseWordAsk;
}

export interface IDataInitRequest {
    roomId: string;
    name: string;
    imgUrl: string;
}

export interface IDataInitResponse {
    playerId: string;
    messages: IMessage[];
    draws: IDraw[];
}

export interface IDataChatRequest {
    message: string;
}

// IDataChatResponse is equals to IMessage

// IDataDrawRequest = IDraw
export interface IDataDrawResponse extends IDraw {
    draftsman: IPlayer;
}

// IDataInfoRequest is empty
export interface IDataInfoResponse {
    roomState: RoomState;
    roundCurrentCycle: number;
    playerAdminId: string | undefined;
    playerList: IPlayer[];
    playerTurn: IPlayer[];
    roomConfig: IRoomConfig;
}

// IDataStartRequest = IRoomConfig
// IDataStartResponse = IRoomConfig on success

export interface IDataChooseWordRequest {
    word: string;
}

export interface IDataChooseWordResponse {
    word: string;
}

export interface IDataChooseWordAsk {
    words: string[];
}

// IDataGuessRequest doesn't exist
export interface IDataGuessResponse {
    playersGuess: IPlayer[];
}

// IDataKickRequest doesn't exist
export interface IDataKickResponse {
    reason?: string;
}

export enum GameSocketChannel {
    PING = "PING",
    PONG = "PONG",
    INIT = "INIT",
    CHAT = "CHAT",
    DRAW = "DRAW",
    INFO = "INFO",
    CONFIG = "CONFIG",
    CHOOSE_WORD = "CHOOSE_WORD",
    START = "START",
    GUESS = "GUESS",
    KICK = "KICK"
}
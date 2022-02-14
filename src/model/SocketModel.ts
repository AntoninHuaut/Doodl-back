import {IDraw, IMessage, IPlayer, IRoomConfig, RoomState} from './GameModel.ts';

export interface SocketUser {
    socket: WebSocket;
    readonly socketUUID: string;
    player?: IPlayer;
    roomId?: string;
}

export interface ISocketMessage {
    channel: SocketChannel;
}

export interface ISocketMessageRequest extends ISocketMessage {
    data?: IDataInitRequest | IDataChatRequest | IDraw | IRoomConfig;
}

export interface ISocketMessageResponse extends ISocketMessage {
    data: IDataInitResponse | IMessage | IDataDrawResponse | IDataInfoResponse | IRoomConfig;
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
    playerList: IPlayer[];
    roomConfig: IRoomConfig;
}

// IDataStartRequest = IRoomConfig
// IDataStartResponse = Not stated (IRoomConfig tmp) // TODO

export enum SocketChannel {
    INIT = "INIT",
    CHAT = "CHAT",
    DRAW = "DRAW",
    INFO = "INFO",
    START = "START"
}
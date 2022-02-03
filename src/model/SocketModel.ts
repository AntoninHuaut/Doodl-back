export interface ISocketMessage {
    channel: SocketChannel;
}

export interface ISocketMessageRequest extends ISocketMessage {
    data: IDataInitRequest | IDataChatRequest;
}

export interface ISocketMessageResponse extends ISocketMessage {
    data: IDataInitResponse | IDataChatResponse;
}

export interface IDataInitRequest {
    roomId: string;
    name: string;
    imgUrl: string;
}

export interface IDataInitResponse {
    playerId: string;
}

export interface IDataChatRequest {
    message: string;
}

export interface IDataChatResponse {
    message: string;
}

export enum SocketChannel {
    INIT = "INIT",
    CHAT = "CHAT",
    DRAW = "DRAW"
}
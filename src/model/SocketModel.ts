export interface ISocketMessageRequest {
    channel: SocketChannel;
    data: IDataInitRequest | IDataChatRequest;
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
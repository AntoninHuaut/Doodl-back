import {IPlayer} from "./GameModel.ts";

export interface ISocketMessage {
    channel: AdminSocketChannel;
}

export interface IAdminSocketConnectResponse extends ISocketMessage {
    data: {
        roomCount: number;
        wsCount: number;
        roomList: IAdminRoomInfo[];
    };
}

export interface IAdminRoomInfo {
    roomId: string;
    playerList: IPlayer[];
}

export enum AdminSocketChannel {
    CONNECT = "CONNECT"
}
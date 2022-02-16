import {IPlayer} from "./GameModel.ts";

export interface IAdminSocketMessage {
    channel: AdminSocketChannel;
}

export interface IAdminSocketConnectResponse extends IAdminSocketMessage {
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
    GLOBAL_DATA = "GLOBAL_DATA"
}
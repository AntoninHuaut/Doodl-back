import {IPlayer} from "./GameModel.ts";

export interface IAdminSocketMessage {
    channel: AdminSocketChannel;
    data?: DataDeletePlayerSchema;
}

export interface IAdminSocketConnectResponse extends IAdminSocketMessage {
    data: {
        roomCount: number;
        wsCount: number;
        drawCount: number;
        roomList: IAdminRoomInfo[];
    };
}

export interface IAdminRoomInfo {
    roomId: string;
    playerList: IPlayer[];
    drawCount: number;
}

export interface IAdminSocketDeletePlayerRequest extends IAdminSocketMessage {
    playerId: string;
}

export enum AdminSocketChannel {
    GLOBAL_DATA = "GLOBAL_DATA",
    DELETE_PLAYER = "DELETE_PLAYER"
}
import {IPlayer} from "./GameModel.ts";

export interface IAdminSocketMessage {
    channel: AdminSocketChannel;
}

export interface IAdminSocketMessageRequest extends IAdminSocketMessage {
    data?: IAdminSocketKickPlayerRequest | IAdminSocketDeleteRoomRequest;
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

export interface IAdminSocketKickPlayerRequest {
    playerId: string;
    roomId: string;
}

export interface IAdminSocketDeleteRoomRequest {
    roomId: string;
}

export enum AdminSocketChannel {
    GLOBAL_DATA = "GLOBAL_DATA",
    KICK_PLAYER = "KICK_PLAYER",
    DELETE_ROOM = "DELETE_ROOM"
}
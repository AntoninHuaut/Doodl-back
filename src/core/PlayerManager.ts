import { IPlayer } from '../model/GameModel.ts';
import { IDataInitRequest, SocketUser } from '../model/SocketModel.ts';
import { getRoomById, addPlayerToRoom, removePlayerIdToRoom } from './RoomManager.ts';
import InvalidParameterValue from '../model/exception/InvalidParameterValue.ts';
import { Room } from '../model/Room.ts';

export function createPlayer(socketUser: SocketUser, dataInit: IDataInitRequest): IPlayer {
    const roomId = dataInit.roomId;
    const room: Room | undefined = getRoomById(roomId);
    if (room == null) throw new InvalidParameterValue("Invalid roomId");
    if (room.hasPlayerId(socketUser.socketUUID)) throw new InvalidParameterValue("Init already done");

    const player: IPlayer = {
        playerId: socketUser.socketUUID,
        name: dataInit.name,
        imgUrl: dataInit.imgUrl
    };

    addPlayerToRoom(player, room);
    return player;
}

export function deletePlayer(socketUser: SocketUser) {
    const room: Room | undefined = getRoomById(socketUser.roomId);
    if (room != null) {
        removePlayerIdToRoom(socketUser.socketUUID, room);
    }
}
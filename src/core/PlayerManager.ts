import {IPlayer} from '../model/GameModel.ts';
import {IDataInitRequest, SocketUser} from '../model/GameSocketModel.ts';
import {addPlayerToRoom, getRoomById, removePlayerIdToRoom} from './RoomManager.ts';
import InvalidParameterValue from '../model/exception/InvalidParameterValue.ts';
import {Room} from './Room.ts';

export function createPlayer(socketUser: SocketUser, dataInit: IDataInitRequest): IPlayer {
    const roomId = dataInit.roomId;
    const room: Room | undefined = getRoomById(roomId);
    if (room == null) throw new InvalidParameterValue("Invalid roomId");
    if (room.hasPlayerId(socketUser.socketUUID)) throw new InvalidParameterValue("Init already done");

    const player: IPlayer = {
        playerId: socketUser.socketUUID,
        name: dataInit.name,
        imgUrl: dataInit.imgUrl,
        totalPoint: 0,
        roundPoint: 0
    };

    addPlayerToRoom(player, room);
    return player;
}

export function deletePlayer(playerId: string, roomId: string | undefined) {
    const room: Room | undefined = getRoomById(roomId);
    if (room != null) {
        removePlayerIdToRoom(playerId, room);
    }
}
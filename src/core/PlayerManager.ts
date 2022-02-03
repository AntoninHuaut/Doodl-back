import { IPlayer } from '../model/GameModel.ts';
import { IDataInitRequest } from '../model/SocketModel.ts';
import { getRoomById, addPlayerToRoom } from './RoomManager.ts';
import InvalidParameterValue from '../model/exception/InvalidParameterValue.ts';
import { Room } from '../model/Room.ts';

export function createPlayer(socketUUID: string, dataInit: IDataInitRequest): IPlayer {
    const roomId = dataInit.roomId;
    const room: Room | undefined = getRoomById(roomId);
    if (room == null) throw new InvalidParameterValue("Invalid roomId");
    if (room.hasPlayerId(socketUUID)) throw new InvalidParameterValue("Init already done");

    const player: IPlayer = {
        playerId: socketUUID,
        name: dataInit.name,
        imgUrl: dataInit.imgUrl
    };

    addPlayerToRoom(player, room);
    return player;
}
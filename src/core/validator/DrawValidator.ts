import { IPlayer } from '../../model/GameModel.ts';
import { Room } from '../../model/Room.ts';

export function isPlayerCanDraw(player: IPlayer, room: Room): boolean {
    return room.round?.canPlayerDraw(player);
}
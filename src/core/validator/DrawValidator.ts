import {IPlayer} from '../../model/GameModel.ts';
import {Room} from '../Room.ts';

export function isPlayerCanDraw(player: IPlayer, room: Room): boolean {
    return true; // TODO TEST WIP
    // return room.round?.canPlayerDraw(player);
}
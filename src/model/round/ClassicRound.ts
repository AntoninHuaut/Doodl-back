import Round from './Round.ts';
import {IPlayer} from '../GameModel.ts';
import {Room} from "../Room.ts";

export default class ClassicRound extends Round {

    constructor(room: Room, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        super(room, dateStartedDrawing, playerTurn)
    }

}
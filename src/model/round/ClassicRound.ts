import Round from './Round.ts';
import { IPlayer } from '../GameModel.ts';

export default class ClassicRound extends Round {

    constructor(dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        super(dateStartedDrawing, playerTurn)
    }

}
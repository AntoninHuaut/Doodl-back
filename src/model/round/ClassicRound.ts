import Round from './Round.ts';
import { IPlayer } from '../GameModel.ts';

export default class ClassicRound extends Round {

    constructor(roundTimeDuration: number, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        super(roundTimeDuration, dateStartedDrawing, playerTurn)
    }

}
import CycleRound from './CycleRound.ts';
import {IPlayer} from '../../model/GameModel.ts';
import {Room} from "../Room.ts";
import {getGuessPoint} from "../WordManager.ts";
import {IDataGuestResponse} from "../../model/GameSocketModel.ts";
import {loggerService} from "../../server.ts";

export default class ClassicCycleRound extends CycleRound {

    constructor(room: Room, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        super(room, dateStartedDrawing, playerTurn)
    }

    protected override guessWord(guessPlayer: IPlayer): IDataGuestResponse {
        loggerService.debug(`ClassicRound::guessWord - Room (${this._room.roomId}) - Player (${guessPlayer.playerId})`);

        this._playersGuess.push(guessPlayer);

        const startDate = this._dateStartedDrawing as Date;
        const endDate = new Date(startDate.getTime() + this._room.roomConfig.timeByTurn * 1000);
        const guessGainPoint = getGuessPoint(startDate, endDate, new Date());
        const drawGainPoint = Math.round(guessGainPoint / 2);

        guessPlayer.point += guessGainPoint;
        this._playerTurn.forEach(drawer => drawer.point += drawGainPoint);

        return {
            guessGainPoint: guessGainPoint,
            drawGainPoint: drawGainPoint,
            guesser: guessPlayer
        }
    }

}
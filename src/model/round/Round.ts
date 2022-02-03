import { IPlayer } from '../GameModel.ts';
import { IDataChatRequest } from '../SocketModel.ts';
export default abstract class Round {

    #roundTimeDuration: number;
    #dateStartedDrawing: Date | null;
    #playerTurn: IPlayer[] | null;

    // #gameChat: Chat;

    constructor(roundTimeDuration: number, dateStartedDrawing: Date | null, playerTurn: IPlayer[] | null) {
        this.#roundTimeDuration = roundTimeDuration;
        this.#dateStartedDrawing = dateStartedDrawing;
        this.#playerTurn = playerTurn;
    }

    get dateStartedDrawing() {
        return this.#dateStartedDrawing;
    }

    get roundTimeDuration() {
        return this.#roundTimeDuration;
    }

    get playerTurn() {
        return this.#playerTurn;
    }

    handleChatMessage(_message: IDataChatRequest, broadcastMessageFunc: () => void) {
        broadcastMessageFunc();
    }
}
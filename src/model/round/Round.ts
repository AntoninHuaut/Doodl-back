import { IPlayer, IDraw } from '../GameModel.ts';
import { IDataChatRequest } from '../SocketModel.ts';
export default abstract class Round {

    #dateStartedDrawing: Date | null;
    #playerTurn: IPlayer[];
    #draws: IDraw[];

    constructor(dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        this.#dateStartedDrawing = dateStartedDrawing;
        this.#playerTurn = playerTurn;
        this.#draws = [];
    }

    get dateStartedDrawing() {
        return this.#dateStartedDrawing;
    }

    get playerTurn() {
        return this.#playerTurn;
    }

    get draws() {
        return this.#draws;
    }

    addDraw(draw: IDraw) {
        this.#draws.push(draw);
    }

    handleChatMessage(_message: IDataChatRequest, broadcastMessageFunc: () => void) {
        broadcastMessageFunc();
    }

    canPlayerDraw(player: IPlayer): boolean {
        return this.#playerTurn.includes(player);
    }
}
import {DrawTool, IDraw, IPlayer} from '../GameModel.ts';
import {IDataChatRequest} from '../SocketModel.ts';

export default abstract class Round {

    #dateStartedDrawing: Date | null;
    #playerTurn: IPlayer[];
    #draws: IDraw[];

    protected constructor(dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
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
        if (draw.tool !== DrawTool.CLEAR) {
            this.#draws.push(draw);
        } else {
            this.#draws.length = 0;
        }
    }

    handleChatMessage(_message: IDataChatRequest, broadcastMessageFunc: () => void) {
        broadcastMessageFunc();
    }

    canPlayerDraw(player: IPlayer): boolean {
        return this.#playerTurn.includes(player);
    }
}
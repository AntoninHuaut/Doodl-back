import {DrawTool, IDraw, IPlayer} from '../GameModel.ts';
import {IDataChatRequest} from '../GameSocketModel.ts';
import {Room} from "../Room.ts";
import InvalidState from "../exception/InvalidState.ts";
import {getRandomWord} from "../../core/WordManager.ts";

export default abstract class Round {

    #room: Room;
    #word: string | undefined;
    #dateStartedDrawing: Date | null;
    #playerTurn: IPlayer[];
    #draws: IDraw[];

    protected constructor(room: Room, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        this.#room = room;
        this.#dateStartedDrawing = dateStartedDrawing;
        this.#playerTurn = playerTurn;
        this.#draws = [];
    }

    startRound() {
        this.#setNextPlayerTurn();
        this.#word = getRandomWord();
        this.#dateStartedDrawing = new Date();
    }

    addDraw(draw: IDraw) {
        if (draw.tool !== DrawTool.CLEAR) {
            this.#draws.push(draw);
        } else {
            this.#draws.length = 0;
        }
    }

    handleChatMessage(message: IDataChatRequest, broadcastMessageFunc: () => void) {
        if (message.message === this.#word) {
            // TODO win points + link player to message in arg
        } else {
            broadcastMessageFunc();
        }
    }

    #setNextPlayerTurn() {
        if (!this.playerTurn?.length) {
            this.playerTurn.push(this.#getRandomPlayer());
        } else {
            const currentIndex = this.#room.players.indexOf(this.playerTurn[0]);
            const nextIndex = (currentIndex + 1) % this.#room.players.length;
            this.playerTurn.length = 0;
            this.playerTurn.push(this.#room.players[nextIndex]);
        }
    }

    canPlayerDraw(player: IPlayer): boolean {
        return this.#playerTurn.includes(player);
    }

    #getRandomPlayer(): IPlayer {
        if (!this.#room.players) throw new InvalidState("PlayerList can't be empty"); // TODO stop game ?

        return this.#room.players[Math.floor((Math.random() * this.#room.players.length))];
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
}
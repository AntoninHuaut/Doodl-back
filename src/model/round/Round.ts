import {DrawTool, IDraw, IPlayer} from '../GameModel.ts';
import {IDataChatRequest, IDataGuestResponse} from '../GameSocketModel.ts';
import {Room} from "../Room.ts";
import InvalidState from "../exception/InvalidState.ts";
import {getRandomWord} from "../../core/WordManager.ts";

export default abstract class Round {

    protected _room: Room;
    protected _word: string | undefined;
    protected _dateStartedDrawing: Date | null;
    protected _playerTurn: IPlayer[];
    protected _draws: IDraw[];

    protected constructor(room: Room, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        this._room = room;
        this._dateStartedDrawing = dateStartedDrawing;
        this._playerTurn = playerTurn;
        this._draws = [];
    }

    startRound() {
        this.#setNextPlayerTurn();
        this._word = getRandomWord();
        this._dateStartedDrawing = new Date();
    }

    addDraw(draw: IDraw) {
        if (draw.tool !== DrawTool.CLEAR) {
            this._draws.push(draw);
        } else {
            this._draws.length = 0;
        }
    }

    handleChatMessage(author: IPlayer, message: IDataChatRequest, broadcastMessageFunc: (_guessData: IDataGuestResponse | undefined) => void) {
        const hasGuess = this.isGameStarted() && message.message === this._word;
        if (hasGuess) {
            const guestData: IDataGuestResponse = this.guessWord(author);
            broadcastMessageFunc(guestData);
        } else {
            broadcastMessageFunc(undefined);
        }
    }

    protected abstract guessWord(guessPlayer: IPlayer): IDataGuestResponse;

    isGameStarted(): boolean {
        return this._dateStartedDrawing !== null && this._word !== null;
    }

    #setNextPlayerTurn() {
        if (!this.playerTurn?.length) {
            this.playerTurn.push(this.#getRandomPlayer());
        } else {
            const currentIndex = this._room.players.indexOf(this.playerTurn[0]);
            const nextIndex = (currentIndex + 1) % this._room.players.length;
            this.playerTurn.length = 0;
            this.playerTurn.push(this._room.players[nextIndex]);
        }
    }

    canPlayerDraw(player: IPlayer): boolean {
        return this._playerTurn.includes(player);
    }

    #getRandomPlayer(): IPlayer {
        if (!this._room.players) throw new InvalidState("PlayerList can't be empty"); // TODO stop game ?

        return this._room.players[Math.floor((Math.random() * this._room.players.length))];
    }

    get dateStartedDrawing() {
        return this._dateStartedDrawing;
    }

    get playerTurn() {
        return this._playerTurn;
    }

    get draws() {
        return this._draws;
    }
}
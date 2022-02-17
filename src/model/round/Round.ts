import {DrawTool, IDraw, IPlayer} from '../GameModel.ts';
import {IDataChatRequest, IDataGuestResponse} from '../GameSocketModel.ts';
import {Room} from "../Room.ts";
import InvalidState from "../exception/InvalidState.ts";
import {getRandomWord} from "../../core/WordManager.ts";
import {loggerService} from "../../server.ts";

export default abstract class Round {

    protected _room: Room;
    protected _dateStartedDrawing: Date | null;
    protected readonly _playerTurn: IPlayer[];

    private _word: string | undefined;
    private readonly _draws: IDraw[];
    private _playersGuess: IPlayer[];
    private _intervalId: number | null;

    private _currentRoundNumber = 0;

    protected constructor(room: Room, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        this._room = room;
        this._dateStartedDrawing = dateStartedDrawing;
        this._playerTurn = playerTurn;
        this._draws = [];
        this._playersGuess = [];
        this._intervalId = null;
    }

    startRound() {
        loggerService.debug(`Round::startRound - Room (${this._room.roomId}) with word ${this._word}`);

        this.#setNextPlayerTurn();
        this._word = getRandomWord();
        this._dateStartedDrawing = new Date();
        this._currentRoundNumber++;

        this._intervalId = setInterval(() => this.checkAllPlayersGuessOrTimeOver(), 1000);
    }

    endRound() {
        loggerService.debug(`Round::endRound - Room ${this._room.roomId} ended`);

        this._draws.length = 0;
        this._playersGuess.length = 0;
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    nextRound() {
        loggerService.debug(`Round::nextRound - Room (${this._room.roomId})`);

        if (this._currentRoundNumber < this._room.roomConfig.roundByGame) {
            this.endRound();
            this.startRound();
        } else {
            this._room.endGame();
        }
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

    private checkAllPlayersGuessOrTimeOver() {
        const skipNextRound: boolean = this._room.players.filter(p => !this._playersGuess.includes(p)).length === 0 || this.isTimeOver();
        if (skipNextRound) {
            loggerService.debug(`Round::checkAllPlayersGuessOrTimeOver - Room (${this._room.roomId}) - All players guess or time over`);

            const delay = 5 * 1000;
            // TODO end round websocket with ${delay} ms
            setTimeout(() => this.nextRound(), delay);
        }
    }

    private isTimeOver(): boolean {
        if (!this._dateStartedDrawing) return false;
        return new Date().getTime() > this._dateStartedDrawing.getTime() + this._room.roomConfig.timeByTurn * 1000;
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

        loggerService.debug(`Round ${this._room.roomId} - PlayerTurn: ${JSON.stringify(this.playerTurn, null, 2)}`);
    }

    canPlayerDraw(player: IPlayer): boolean {
        return this._playerTurn.includes(player);
    }

    #getRandomPlayer(): IPlayer {
        if (!this._room.players) throw new InvalidState("PlayerList can't be empty"); // TODO stop game ? cf RoomManager::removePlayerIdToRoom

        return this._room.players[Math.floor((Math.random() * this._room.players.length))];
    }

    get anonymeWord(): string {
        // TODO reveal one letter
        return this._word?.replace(/./g, "_") ?? "";
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
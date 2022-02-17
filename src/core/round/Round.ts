import {DrawTool, IDraw, IPlayer} from '../../model/GameModel.ts';
import {IDataChatRequest, IDataGuestResponse} from '../../model/GameSocketModel.ts';
import {Room} from "../Room.ts";
import {getRandomWord} from "../WordManager.ts";
import {loggerService} from "../../server.ts";
import {appRoomConfig} from "../../config.ts";

export default abstract class Round {

    protected _room: Room;
    protected _dateStartedDrawing: Date | null;

    protected _playerTurn: IPlayer[];
    protected _playerNoYetPlayedCurrentCycle: IPlayer[];
    protected _playersGuess: IPlayer[];

    private _word: string | null;
    private readonly _draws: IDraw[];
    private _intervalId: number | null;

    private _currentCycleRoundNumber = 0;

    protected constructor(room: Room, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        this._room = room;
        this._dateStartedDrawing = dateStartedDrawing;
        this._playerTurn = playerTurn;
        this._draws = [];
        this._playersGuess = [];
        this._playerNoYetPlayedCurrentCycle = [];
        this._intervalId = null;
        this._word = null;
    }

    startRound() {
        this._word = getRandomWord();
        loggerService.debug(`Round::startRound - Room (${this._room.roomId}) with word ${this._word}`);

        if (this._playerNoYetPlayedCurrentCycle.length === 0) {
            if (this._room.players.length < appRoomConfig.minPlayerPerRoom) {
                return this._room.endGame();
            }

            this._currentCycleRoundNumber++;
            this._playerNoYetPlayedCurrentCycle.length = 0;
            this._room.players.forEach(p => this._playerNoYetPlayedCurrentCycle.push(p));
            shuffle(this._playerNoYetPlayedCurrentCycle);
        }

        this.#setNextPlayerTurn();
        this._dateStartedDrawing = new Date();

        this._intervalId = setInterval(() => this.checkRoundOver(), 1000);
    }

    endRound() {
        loggerService.debug(`Round::endRound - Room ${this._room.roomId} ended`);

        this._dateStartedDrawing = null;
        this._draws.length = 0;
        this._playerTurn.length = 0;
        this._playersGuess.length = 0;
        this._word = null;

        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    nextRound() {
        loggerService.debug(`Round::nextRound - Room (${this._room.roomId})`);

        this.endRound()
        if (this._currentCycleRoundNumber < this._room.roomConfig.cycleRoundByGame) {
            this.startRound();
        } else {
            this._room.endGame();
        }
    }

    removePlayerId(playerId: string) {
        this._playerTurn = this._playerTurn.filter(p => p.playerId !== playerId);
        this._playersGuess = this._playersGuess.filter(p => p.playerId !== playerId);
        this._playerNoYetPlayedCurrentCycle = this._playerNoYetPlayedCurrentCycle.filter(p => p.playerId !== playerId);

        this.checkRoundOver();
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
            if (this._playersGuess.includes(author)) return;

            const guestData: IDataGuestResponse = this.guessWord(author);
            broadcastMessageFunc(guestData);
        } else {
            broadcastMessageFunc(undefined);
        }
    }

    protected abstract guessWord(guessPlayer: IPlayer): IDataGuestResponse;

    private checkRoundOver() {
        const timeIsOver = this._dateStartedDrawing && new Date().getTime() > this._dateStartedDrawing.getTime() + this._room.roomConfig.timeByTurn * 1000
        const allPlayerGuessed = this._room.players.filter(p => !this._playersGuess.includes(p)).length === 0;
        const roundOver: boolean = timeIsOver || this._playerTurn.length === 0 || allPlayerGuessed;

        if (roundOver) {
            loggerService.debug(`Round::isRoundOver - Room (${this._room.roomId}) - round over`);

            const delay = 5 * 1000;
            // TODO end round websocket with ${delay} ms
            setTimeout(() => this.nextRound(), delay);
        }
    }

    isGameStarted(): boolean {
        return this._dateStartedDrawing !== null && this._word !== null;
    }

    #setNextPlayerTurn() {
        const nextPlayer: IPlayer | undefined = this._playerNoYetPlayedCurrentCycle.shift();
        if (!nextPlayer) {
            return this.nextRound();
        }

        this.playerTurn.length = 0;
        this.playerTurn.push(nextPlayer);

        loggerService.debug(`Round ${this._room.roomId} - PlayerTurn: ${JSON.stringify(this.playerTurn, null, 2)}`);
    }

    canPlayerDraw(player: IPlayer): boolean {
        return this._playerTurn.includes(player);
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

function shuffle<T>(a: T[]) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
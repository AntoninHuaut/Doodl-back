import {DrawTool, IDraw, IPlayer, RoomState} from '../../model/GameModel.ts';
import {IDataChatRequest, IDataGuessResponse} from '../../model/GameSocketModel.ts';
import {Room} from "../Room.ts";
import {getNbRandomWord, getRandomWordFromArray, revealOneLetter} from "../WordManager.ts";
import {loggerService} from "../../server.ts";
import {appRoomConfig} from "../../config.ts";
import {
    sendAskChooseWordMessage,
    sendGuessData,
    sendIDataInfoResponse,
    sendIDataInfoResponseToPlayer
} from "../../resource/socket/GameSocketResource.ts";

export default abstract class CycleRound {

    private static DELAY_NEXT_ROUND = 5 * 1000;
    private static DELAY_END_GAME = 10 * 1000;
    private static DELAY_CHOOSE_WORD = 10 * 1000;

    protected _room: Room;
    protected _dateStartedDrawing: Date | null;

    protected _playerTurn: IPlayer[];
    protected _playerNoYetPlayedCurrentCycle: IPlayer[];
    protected _playersGuess: IPlayer[];

    private _word: string | null;
    private _anonymeWord: string | null;
    private _possibleWords: string[];

    private readonly _draws: IDraw[];
    private _intervalId: number | null;
    private _timeoutNextRoundId: number | null;
    private _timeoutEndGameId: number | null;
    private _timeoutUserChooseWord: number | null;

    private _currentCycleRoundNumber = 0;

    protected constructor(room: Room, dateStartedDrawing: Date | null, playerTurn: IPlayer[]) {
        this._room = room;
        this._dateStartedDrawing = dateStartedDrawing;
        this._playerTurn = playerTurn;
        this._draws = [];
        this._playersGuess = [];
        this._playerNoYetPlayedCurrentCycle = [];
        this._intervalId = null;
        this._timeoutNextRoundId = null;
        this._timeoutEndGameId = null;
        this._timeoutUserChooseWord = null;
        this._word = null;
        this._anonymeWord = null;
        this._possibleWords = [];
    }

    startRound() {
        this._possibleWords = getNbRandomWord(3);
        loggerService.debug(`Round::startRound - Room (${this._room.roomId}) with possible words ${this._possibleWords}`);

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

        this._room.state = RoomState.CHOOSE_WORD;
        sendAskChooseWordMessage(this);
        sendIDataInfoResponse(this._room);

        this._timeoutUserChooseWord = setTimeout(() => {
            this._timeoutUserChooseWord = null;
            this.setUserChooseWord(getRandomWordFromArray(this._possibleWords));
        }, CycleRound.DELAY_CHOOSE_WORD);
    }

    endRound() {
        loggerService.debug(`Round::endRound - Room ${this._room.roomId} ended`);

        this._dateStartedDrawing = null;
        this._draws.length = 0;
        this._playerTurn.length = 0;
        this._playersGuess.length = 0;
        this._possibleWords.length = 0;
        this._word = null;
        this._anonymeWord = null;
        this._room.players.forEach(p => {
            p.totalPoint += p.roundPoint;
            p.roundPoint = 0;
        });

        this.#clearRunnable();
    }

    nextRound() {
        if (!this._room.isInGame()) return;

        loggerService.debug(`Round::nextRound - Room (${this._room.roomId})`);

        this.endRound()
        if (this._currentCycleRoundNumber < this._room.roomConfig.cycleRoundByGame) {
            this.startRound();
        } else {
            this._room.state = RoomState.END_GAME;
            sendIDataInfoResponse(this._room);

            this.#clearEndGameTimeout();
            this._timeoutEndGameId = setTimeout(() => {
                this._timeoutEndGameId = null;
                this._room.endGame();
            }, CycleRound.DELAY_END_GAME);
        }
    }

    #clearRunnable() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        if (this._timeoutNextRoundId) {
            clearTimeout(this._timeoutNextRoundId);
            this._timeoutNextRoundId = null;
        }

        this.#clearEndGameTimeout();
        this.#clearUserChooseWordTimeout();
    }

    #clearEndGameTimeout() {
        if (this._timeoutEndGameId) {
            clearTimeout(this._timeoutEndGameId);
            this._timeoutEndGameId = null;
        }
    }

    #clearUserChooseWordTimeout() {
        if (this._timeoutUserChooseWord) {
            clearTimeout(this._timeoutUserChooseWord);
            this._timeoutUserChooseWord = null;
        }
    }

    setUserChooseWord(word: string) {
        if (this._room.state !== RoomState.CHOOSE_WORD) return;
        if (!this._possibleWords.includes(word)) return;

        loggerService.debug(`Round::setUserChooseWord - Room ${this._room.roomId} with word ${word}`);
        this.#clearUserChooseWordTimeout();

        this._room.state = RoomState.DRAWING;
        this._word = word;
        this._anonymeWord = revealOneLetter(this._word);
        this._dateStartedDrawing = new Date();
        this._intervalId = setInterval(() => this.checkRoundOver(), 1000);

        sendIDataInfoResponse(this._room);
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

    handleChatMessage(author: IPlayer, message: IDataChatRequest,
                      broadcastMessageFunc: (_guessData: IDataGuessResponse | undefined) => void) {
        const hasGuess = this.isGameStarted() && message.message.toLowerCase() === this._word?.toLowerCase();
        if (hasGuess) {
            if (this._playerTurn.includes(author) || this._playersGuess.includes(author)) return;

            this.guessWord(author);

            sendIDataInfoResponseToPlayer(author, this._room);
            sendGuessData(this._room);
        } else {
            broadcastMessageFunc(undefined);
        }
    }

    protected abstract guessWord(guessPlayer: IPlayer): void;

    private checkRoundOver() {
        if (!this._room.isInGame()) return;

        const timeIsOver = this._dateStartedDrawing && new Date().getTime() > this._dateStartedDrawing.getTime() + this._room.roomConfig.timeByTurn * 1000
        const allPlayerGuessed = this._room.players.filter(p => !this.hasGuessOrDrawer(p)).length === 0;
        const roundOver: boolean = timeIsOver || this._playerTurn.length === 0 || allPlayerGuessed;

        if (roundOver) {
            loggerService.debug(`Round::isRoundOver - Room (${this._room.roomId}) - round over`);
            this.#clearRunnable();

            this._room.state = RoomState.END_ROUND;
            sendIDataInfoResponse(this._room);

            this._timeoutNextRoundId = setTimeout(() => {
                this._timeoutNextRoundId = null;
                this.nextRound();
            }, CycleRound.DELAY_NEXT_ROUND);
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

    hasGuessOrDrawer(player: IPlayer): boolean {
        return this._playersGuess.includes(player) || this._playerTurn.includes(player);
    }

    canPlayerDraw(player: IPlayer): boolean {
        return this._playerTurn.includes(player);
    }

    get anonymeWord() {
        return this._anonymeWord;
    }

    get word() {
        return this._word;
    }

    get playersGuess() {
        return this._playersGuess;
    }

    get dateStartedDrawing() {
        return this._dateStartedDrawing;
    }

    get roundCurrentCycle() {
        return this._currentCycleRoundNumber;
    }

    get playerTurn() {
        return this._playerTurn;
    }

    get possibleWords() {
        return this._possibleWords;
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
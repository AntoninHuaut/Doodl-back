import {DrawTool, IDraw, IMessage, IPlayer, RoomState} from '../../model/GameModel.ts';
import {GameSocketChannel, IDataChatRequest, ISocketMessageResponse} from '../../model/GameSocketModel.ts';
import {Room} from "../Room.ts";
import {getNbRandomWord, getRandomWordFromArray, revealOneLetter} from "../WordManager.ts";
import {loggerService} from "../../server.ts";
import {appRoomConfig} from "../../config.ts";
import {
    broadcastMessage,
    sendAskChooseWordMessage,
    sendGuessData,
    sendIDataInfoResponse,
    sendIDataInfoResponseToPlayer
} from "../../resource/socket/GameSocketResource.ts";
import {getValidChatMessage} from "../validator/ChatMessageValidator.ts";

export default abstract class CycleRound {

    public static DELAY_NEXT_ROUND = 5; // seconds
    public static DELAY_END_GAME = 10; // seconds
    public static DELAY_CHOOSE_WORD = 15; // seconds
    private static WORD_CHOOSE_WORD_NB = 3;

    protected _room: Room;
    protected _dateStateStarted: Date | null;

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
        this._dateStateStarted = dateStartedDrawing;
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
        this._possibleWords = getNbRandomWord(this._room.availableWords, CycleRound.WORD_CHOOSE_WORD_NB);
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
        this._dateStateStarted = new Date();

        sendAskChooseWordMessage(this);
        sendIDataInfoResponse(this._room);

        this._timeoutUserChooseWord = setTimeout(() => {
            this._timeoutUserChooseWord = null;
            this.setUserChooseWord(getRandomWordFromArray(this._possibleWords));
        }, CycleRound.DELAY_CHOOSE_WORD * 1000);
    }

    endRound() {
        loggerService.debug(`Round::endRound - Room ${this._room.roomId} ended`);

        this._dateStateStarted = null;
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
        this.endRound();

        if (this._playerNoYetPlayedCurrentCycle.length === 0 && this._currentCycleRoundNumber === this._room.roomConfig.cycleRoundByGame) {
            this._room.state = RoomState.END_GAME;
            this._dateStateStarted = new Date();

            sendIDataInfoResponse(this._room);

            this.#clearEndGameTimeout();
            this._timeoutEndGameId = setTimeout(() => {
                this._timeoutEndGameId = null;
                this._room.endGame();
            }, CycleRound.DELAY_END_GAME * 1000);
        } else {
            this.startRound();
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
        this._dateStateStarted = new Date();

        this._word = word;
        this._anonymeWord = revealOneLetter(this._word);
        this._intervalId = setInterval(() => this.checkRoundOver(), 1000);

        sendIDataInfoResponse(this._room);
    }

    removePlayerId(playerId: string) {
        this._playerTurn = this._playerTurn.filter(p => p.playerId !== playerId);
        this._playersGuess = this._playersGuess.filter(p => p.playerId !== playerId);
        this._playerNoYetPlayedCurrentCycle = this._playerNoYetPlayedCurrentCycle.filter(p => p.playerId !== playerId);
    }

    addDraw(draw: IDraw) {
        if (draw.tool !== DrawTool.CLEAR) {
            this._draws.push(draw);
        } else {
            this._draws.length = 0;
        }
    }

    handleChatMessage(author: IPlayer, message: IDataChatRequest) {
        const hasGuess = this._room.state === RoomState.DRAWING && message.message.toLowerCase() === this._word?.toLowerCase();
        const isSpectatorMessage = this.hasAlreadyGuessOrIsDrawer(author);

        if (hasGuess) {
            if (isSpectatorMessage) return;

            this.guessWord(author);

            sendIDataInfoResponseToPlayer(author, this._room);
            sendGuessData(this._room);
        } else {
            const chatResponse: IMessage | undefined = getValidChatMessage(author, message.message, isSpectatorMessage);
            if (!chatResponse) return;

            const responseChatMessage: ISocketMessageResponse = {
                channel: GameSocketChannel.CHAT,
                data: chatResponse
            };

            this._room.addMessage(chatResponse);

            let ignoresPlayersId: string[] = [];
            if (isSpectatorMessage) {
                ignoresPlayersId = this._room.players.filter(p => !this.hasAlreadyGuessOrIsDrawer(p)).map(p => p.playerId);
            }

            broadcastMessage(this._room, JSON.stringify(responseChatMessage), ignoresPlayersId);
        }
    }

    private hasAlreadyGuessOrIsDrawer(player: IPlayer): boolean {
        return this._playerTurn.includes(player) || this._playersGuess.includes(player);
    }

    protected abstract guessWord(guessPlayer: IPlayer): void;

    public checkRoundOver() {
        if (!this._room.isInGame()) return;

        const timeIsOver = this._room.state === RoomState.DRAWING && this._dateStateStarted && new Date().getTime() > this._dateStateStarted.getTime() + this._room.roomConfig.timeByTurn * 1000
        const allPlayerGuessed = this._room.players.filter(p => !this.hasGuessOrDrawer(p)).length === 0;
        const roundOver: boolean = timeIsOver || this._playerTurn.length === 0 || allPlayerGuessed;

        if (roundOver) {
            loggerService.debug(`Round::isRoundOver - Room (${this._room.roomId}) - round over`);
            this.#clearRunnable();

            this._room.state = RoomState.END_ROUND;
            this._dateStateStarted = new Date();
            sendIDataInfoResponse(this._room);

            this._timeoutNextRoundId = setTimeout(() => {
                this._timeoutNextRoundId = null;
                this.nextRound();
            }, CycleRound.DELAY_NEXT_ROUND * 1000);
        }
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

    get dateStateStarted() {
        return this._dateStateStarted;
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
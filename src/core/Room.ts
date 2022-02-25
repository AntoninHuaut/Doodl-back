import CycleRound from './round/CycleRound.ts';
import ClassicCycleRound from './round/ClassicCycleRound.ts';
import {GameMode, IMessage, IPlayer, IRoomConfig, IRoomStatus, RoomState, WordList} from '../model/GameModel.ts';
import InvalidState from '../model/exception/InvalidState.ts';
import {sendIDataInfoResponse} from "../resource/socket/GameSocketResource.ts";
import {loggerService} from "../server.ts";
import {getWordList} from "./WordManager.ts";

export class Room {

    static readonly DEFAULT_GAMEMODE: GameMode = GameMode.CLASSIC;
    static readonly DEFAULT_ROUND_TIME_DURATION: number = 90;
    static readonly DEFAULT_CYCLE_ROUND_BY_GAME: number = 5;
    static readonly DEFAULT_WORD_LIST: WordList = WordList.ANIMALS;

    #roomId: string;
    #playerAdminId: string | undefined = undefined;

    #players: IPlayer[];
    #messages: IMessage[];

    #round: CycleRound;
    #state: RoomState;
    #roomConfig: IRoomConfig;

    #availableWords: string[];

    constructor(roomId: string) {
        this.#roomId = roomId;
        this.#roomConfig = {
            gameMode: Room.DEFAULT_GAMEMODE,
            timeByTurn: Room.DEFAULT_ROUND_TIME_DURATION,
            cycleRoundByGame: Room.DEFAULT_CYCLE_ROUND_BY_GAME,
            wordList: Room.DEFAULT_WORD_LIST
        };
        this.#round = new ClassicCycleRound(this, null, []);
        this.#state = RoomState.LOBBY;
        this.#players = [];
        this.#messages = [];
        this.#availableWords = [];

    }

    #createRound() {
        loggerService.debug(`Room::createRound - Room (${this.#roomId})`);

        switch (this.#roomConfig.gameMode) {
            case GameMode.CLASSIC:
                this.#round = new ClassicCycleRound(this, null, []);
                break;
            default:
                this.#roomConfig.gameMode = Room.DEFAULT_GAMEMODE;
        }
    }

    addPlayer(player: IPlayer) {
        if (!this.#players.includes(player)) {
            this.#players.push(player);
        }
    }

    hasPlayerId(playerId: string): boolean {
        return this.#players.some((p: IPlayer) => p.playerId == playerId);
    }

    removePlayerId(playerId: string) {
        this.#players = this.#players.filter((p: IPlayer) => p.playerId != playerId);
        this.round.removePlayerId(playerId);
    }

    addMessage(message: IMessage) {
        this.#messages.push(message);
    }

    async startGame() {
        loggerService.debug(`Room::startGame - Room (${this.#roomId})`);

        this.#availableWords = await getWordList(this.#roomConfig.wordList);

        this.#createRound();
        this.players.forEach(player => {
            player.totalPoint = 0;
            player.roundPoint = 0
        });
        this.round.startRound();
    }

    endGame() {
        if (!this.isInGame()) return;

        loggerService.debug(`Room::endGame - Room (${this.#roomId})`);

        this.round.endRound();
        this.state = RoomState.LOBBY;
        sendIDataInfoResponse(this);
    }

    setRoomConfig(config: IRoomConfig) {
        if (this.#state !== RoomState.LOBBY) throw new InvalidState("Room can only be updated in lobby");

        this.#roomConfig = config;
        this.#createRound();
    }

    set state(state: RoomState) {
        this.#state = state;
    }

    get state(): RoomState {
        return this.#state
    }

    get status(): IRoomStatus {
        return {
            isPlaying: this.#round.dateStartedDrawing !== null,
            playerList: this.#players,
            playerTurn: this.#round.playerTurn
        }
    }

    isPlayerAdmin(player: IPlayer) {
        return player.playerId === this.#playerAdminId;
    }

    isInGame(): boolean {
        return this.#state !== RoomState.LOBBY;
    }

    get availableWords(): string[] {
        return this.#availableWords;
    }

    get roomConfig(): IRoomConfig {
        return this.#roomConfig;
    }

    get players() {
        return this.#players;
    }

    get messages() {
        return this.#messages;
    }

    get round(): CycleRound {
        return this.#round;
    }

    get roomId() {
        return this.#roomId;
    }

    set playerAdminId(playerAdminId: string | undefined) {
        this.#playerAdminId = playerAdminId;
    }

    get playerAdminId() {
        return this.#playerAdminId;
    }
}
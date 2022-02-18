import CycleRound from './round/CycleRound.ts';
import ClassicCycleRound from './round/ClassicCycleRound.ts';
import {GameMode, IMessage, IPlayer, IRoomConfig, IRoomStatus, RoomState} from '../model/GameModel.ts';
import InvalidState from '../model/exception/InvalidState.ts';
import {broadcastMessage, getISocketMessageResponse} from "../resource/socket/GameSocketResource.ts";
import {loggerService} from "../server.ts";

export class Room {

    static readonly DEFAULT_GAMEMODE: GameMode = GameMode.CLASSIC;
    static readonly DEFAULT_ROUND_TIME_DURATION: number = 90;
    static readonly DEFAULT_CYCLE_ROUND_BY_GAME: number = 5;


    #roomId: string;
    #playerAdminId: string | undefined = undefined;

    #players: IPlayer[];
    #messages: IMessage[];

    #round: CycleRound;
    #state: RoomState;
    #roomConfig: IRoomConfig;

    constructor(roomId: string) {
        this.#roomId = roomId;
        this.#roomConfig = {
            gameMode: Room.DEFAULT_GAMEMODE,
            timeByTurn: Room.DEFAULT_ROUND_TIME_DURATION,
            cycleRoundByGame: Room.DEFAULT_CYCLE_ROUND_BY_GAME
        };
        this.#round = new ClassicCycleRound(this, null, []);
        this.#state = RoomState.LOBBY;
        this.#players = [];
        this.#messages = [];
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

    startGame() {
        loggerService.debug(`Room::startGame - Room (${this.#roomId})`);

        this.#createRound();
        this.players.forEach(player => player.point = 0);
        this.state = RoomState.INGAME;
        this.round.startRound();
    }

    endGame() {
        if (this.#state !== RoomState.INGAME) return;

        loggerService.debug(`Room::endGame - Room (${this.#roomId})`);

        this.state = RoomState.LOBBY;
        this.round.endRound();
        broadcastMessage(this, JSON.stringify(getISocketMessageResponse(this)))
    }

    set roomConfig(config: IRoomConfig) {
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
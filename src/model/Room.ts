import Round from './round/Round.ts';
import ClassicRound from './round/ClassicRound.ts';
import {GameMode, IMessage, IPlayer, IRoomConfig, IRoomStatus, RoomState} from './GameModel.ts';
import InvalidState from './exception/InvalidState.ts';

export class Room {

    static readonly DEFAULT_GAMEMODE: GameMode = GameMode.CLASSIC;
    static readonly DEFAULT_MAX_PLAYERS: number = 16;
    static readonly DEFAULT_ROUND_TIME_DURATION: number = 90;

    #roomId: string;
    #playerAdminId: string | undefined = undefined;

    #players: IPlayer[];
    #messages: IMessage[];

    #round: Round;
    #state: RoomState;
    #roomConfig: IRoomConfig;

    constructor(roomId: string) {
        this.#roomId = roomId;
        this.#roomConfig = {
            gameMode: Room.DEFAULT_GAMEMODE,
            maxPlayer: Room.DEFAULT_MAX_PLAYERS,
            timeByTurn: Room.DEFAULT_ROUND_TIME_DURATION
        };
        this.#round = new ClassicRound(this, null, []);
        this.#state = RoomState.LOBBY;
        this.#players = [];
        this.#messages = [];
    }

    #createRound() {
        switch (this.#roomConfig.gameMode) {
            case GameMode.CLASSIC:
                this.#round = new ClassicRound(this, null, []);
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
    }

    addMessage(message: IMessage) {
        this.#messages.push(message);
    }

    startGame() {
        this.state = RoomState.INGAME;
        this.round.startRound();
    }

    resetGame() {
        this.#createRound();
        this.players.forEach(player => player.point = 0); // TODO test
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

    get round(): Round {
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
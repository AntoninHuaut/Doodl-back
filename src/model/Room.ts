import Round from './round/Round.ts';
import ClassicRound from './round/ClassicRound.ts';
import { IPlayer, GameMode, IRoomConfig, IRoomStatus, IMessage, RoomState } from './GameModel.ts';

export class Room {

    #roomId: string;

    #players: IPlayer[];
    #messages: IMessage[];

    #round: Round;
    #state: RoomState;
    #gameMode: GameMode;
    #maxPlayer: number;

    constructor(roomId: string, gameMode: GameMode, maxPlayer: number, roundTimeDuration: number) {
        this.#roomId = roomId;
        this.#gameMode = gameMode;
        this.#maxPlayer = maxPlayer;
        this.#state = RoomState.LOBBY;
        this.#players = [];
        this.#messages = [];

        switch (gameMode) {
            case 'CLASSIC':
                this.#round = new ClassicRound(roundTimeDuration, null, []);
                break;
            default:
                throw new Error("Invalid gameMode");
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

    getPlayersId() {
        return this.#players.map(p => p.playerId);
    }

    addMessage(message: IMessage) {
        this.#messages.push(message);
    }

    get players() {
        return this.#players;
    }

    get messages() {
        return this.#messages;
    }

    get state(): RoomState {
        return this.#state
    }

    get round(): Round {
        return this.#round;
    }

    get config(): IRoomConfig {
        return {
            gameMode: this.#gameMode,
            timeByTurn: this.#round.roundTimeDuration,
            maxPlayer: this.#maxPlayer
        }
    }

    get status(): IRoomStatus {
        return {
            isPlaying: this.#round.dateStartedDrawing !== null,
            playerList: this.#players,
            playerTurn: this.#round.playerTurn
        }
    }

    get roomId() {
        return this.#roomId;
    }
}
import Round from './round/Round.ts';
import ClassicRound from './round/ClassicRound.ts';
import { IPlayer, GameMode, IRoomConfig, IRoomStatus } from './GameModel.ts';

export class Room {
    #roomId: string;
    #players: IPlayer[];
    #round: Round;

    #gameMode: GameMode;
    #maxPlayer: number;

    constructor(roomId: string, gameMode: GameMode, maxPlayer: number, roundTimeDuration: number) {
        this.#roomId = roomId;
        this.#gameMode = gameMode;
        this.#maxPlayer = maxPlayer;
        this.#players = [];

        switch (gameMode) {
            case 'CLASSIC':
                this.#round = new ClassicRound(roundTimeDuration, null, null);
                break;
            default:
                throw new Error("Invalid gameMode");
        }
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
            isPlaying: !!this.#round.dateStartedDrawing,
            playerList: this.#players,
            playerTurn: this.#round.playerTurn
        }
    }

    get roomId() {
        return this.#roomId;
    }
}
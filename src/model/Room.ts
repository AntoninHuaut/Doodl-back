import Round from './round/Round.ts';
import ClassicRound from './round/ClassicRound.ts';
import { IPlayer, GameMode, RoomConfig, RoomStatus } from './GameModel.ts';

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

    get config(): RoomConfig {
        return {
            gameMode: this.#gameMode,
            timeByTurn: this.#round.roundTimeDuration,
            maxPlayer: this.#maxPlayer
        }
    }

    get status(): RoomStatus {
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
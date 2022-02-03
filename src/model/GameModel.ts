export interface IRoomConfig {
  gameMode: string;
  timeByTurn: number;
  maxPlayer: number;
}

export interface IPlayer {
  playerId: string;
  name: string;
  imgUrl: string;
}

export interface IRoomStatus {
  isPlaying: boolean;
  playerList: IPlayer[];
  playerTurn: IPlayer[] | IPlayer | null;
}

export enum GameMode {
  CLASSIC = "CLASSIC",
}
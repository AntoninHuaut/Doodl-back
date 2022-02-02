export interface RoomConfig {
  gameMode: string;
  timeByTurn: number;
  maxPlayer: number;
}

export interface IPlayer {
  playerId: string;
  playerToken: string;
  name: string;
  imgUrl: string;
}

export interface RoomStatus {
  isPlaying: boolean;
  playerList: IPlayer[];
  playerTurn: IPlayer[] | IPlayer | null;
}

export enum GameMode {
  CLASSIC = "CLASSIC",
}
export interface IRoomConfig {
  gameMode: string;
  timeByTurn: number;
  maxPlayer: number;
}

export interface IPlayer {
  name: string;
  imgUrl: string;
  playerId: string;
}

export interface IRoomStatus {
  isPlaying: boolean;
  playerList: IPlayer[];
  playerTurn: IPlayer[];
}

export interface IMessage {
  author: IPlayer;
  message: string;
  timestamp: Date;
}

export interface IDraw {
  tool: DrawTool;
  coords: { x: number, y: number };
  color?: string;
  lineWidth?: number;
}

export enum DrawTool {
  BRUSH = "BRUSH",
  ERASER = "ERASER",
  FILL = "FILL"
}

export enum GameMode {
  CLASSIC = "CLASSIC",
}
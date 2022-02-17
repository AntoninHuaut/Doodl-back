export interface IRoomConfig {
    gameMode: GameMode;
    timeByTurn: number;
    cycleRoundByGame: number;
}

export interface IPlayer {
    name: string;
    imgUrl: string;
    playerId: string;
    point: number;
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

export interface ICoordinate {
    x: number;
    y: number;
}

export interface IDraw {
    tool: DrawTool;
    coordsTo?: ICoordinate;
    coordsFrom?: ICoordinate;
    color?: string;
    lineWidth?: number;
}

export enum RoomState {
    LOBBY = "LOBBY",
    INGAME = "INGAME"
}

export enum DrawTool {
    BRUSH = "BRUSH",
    ERASER = "ERASER",
    FILL = "FILL",
    CLEAR = "CLEAR"
}

export enum GameMode {
    CLASSIC = "CLASSIC",
}
export interface IRoomConfig {
    gameMode: GameMode;
    timeByTurn: number;
    cycleRoundByGame: number;
}

export interface IPlayer {
    name: string;
    imgUrl: string;
    playerId: string;
    totalPoint: number;
    roundPoint: number;
}

export interface RoundData {
    dateStartedDrawing: Date | null;
    roundCurrentCycle: number;
    word: string;
    playerTurn: IPlayer[];
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
    isSpectator: boolean;
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
    CHOOSE_WORD = "CHOOSE_WORD",
    DRAWING = "DRAWING",
    END_ROUND = "END_ROUND",
    END_GAME = "END_GAME"
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
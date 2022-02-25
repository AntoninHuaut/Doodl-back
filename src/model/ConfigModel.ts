export interface IAppConfig {
    server: IServerConfig;
    room: IRoomServerConfig;
}

export interface IServerConfig {
    hostname: string;
    port: number;
    secure: boolean;
    cert_file?: string;
    key_file?: string;
}

export interface IRoomServerConfig {
    minPlayerPerRoom: number;
    maxPlayerPerRoom: number;
    minTimeByTurn: number;
    maxTimeByTurn: number;
    minCycleRoundByGame: number;
    maxCycleRoundByGame: number;
    minPlayerNameLength: number;
    maxPlayerNameLength: number;

    maxChatMessageLength: number;
    minPointGuess: number;
    maxPointGuess: number;
}
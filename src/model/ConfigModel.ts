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
    minMaxPlayer: number;
    maxMaxPlayer: number;
    minTimeByTurn: number;
    maxTimeByTurn: number;
    maxChatMessageLength: number;
    minPointGuess: number;
    maxPointGuess: number;
}
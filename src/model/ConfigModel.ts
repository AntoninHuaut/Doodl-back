export interface IAppConfig {
    server: IServerConfig;
    room: IRoomConfig;
}

export interface IServerConfig {
    hostname: string;
    port: number;
    secure: boolean;
    cert_file?: string;
    key_file?: string;
}

export interface IRoomConfig {
    minMaxPlayer: number;
    maxMaxPlayer: number;
    minTimeByTurn: number;
    maxTimeByTurn: number;
}
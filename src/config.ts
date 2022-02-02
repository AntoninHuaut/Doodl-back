interface IAppConfig {
    server: IServerConfig;
}

interface IServerConfig {
    hostname: string;
    port: number;
    secure: boolean;
    cert_file?: string;
    key_file?: string;
}

import configRaw from "../config.json"  assert { type: "json" };
const globalConfig: IAppConfig = configRaw;
export const serverConfig: IServerConfig = globalConfig.server;
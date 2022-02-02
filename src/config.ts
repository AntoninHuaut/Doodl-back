import { IAppConfig, IServerConfig, IRoomConfig } from "./model/ConfigModel.ts";

import configRaw from "../config.json"  assert { type: "json" };
const globalConfig: IAppConfig = configRaw;
export const serverConfig: IServerConfig = globalConfig.server;
export const roomConfig: IRoomConfig = globalConfig.room;
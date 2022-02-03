import { IAppConfig, IServerConfig, IRoomServerConfig } from "./model/ConfigModel.ts";

import configRaw from "../config.json"  assert { type: "json" };
const globalConfig: IAppConfig = configRaw;
export const serverConfig: IServerConfig = globalConfig.server;
export const roomConfig: IRoomServerConfig = globalConfig.room;
import { IAppConfig, IServerConfig, IRoomServerConfig } from "./model/ConfigModel.ts";

import configRaw from "../config.json"  assert { type: "json" };
const globalConfig: IAppConfig = configRaw;
export const appServerConfig: IServerConfig = globalConfig.server;
export const appRoomConfig: IRoomServerConfig = globalConfig.room;
import { Drash, PaladinService, ResponseTimeService } from "./deps.ts";
import { LoggerService } from "./service/LoggerService.ts";
import { serverConfig } from "./config.ts";

import HomeResource from "./resource/HomeResource.ts";
import FilesResource from "./resource/FilesResource.ts";
import SocketResource from "./resource/SocketResource.ts";

export const server = new Drash.Server({
    hostname: serverConfig.hostname,
    port: serverConfig.port,
    protocol: serverConfig.secure ? "https" : "http",
    services: [
        new LoggerService(),
        new PaladinService(),
        new ResponseTimeService(),
    ],
    resources: [
        HomeResource,
        FilesResource,
        SocketResource
    ],
});
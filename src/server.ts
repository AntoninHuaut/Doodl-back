import { Drash, PaladinService, ResponseTimeService, CORSService } from "./deps.ts";
import LoggerService from "./service/LoggerService.ts";
import { serverConfig } from "./config.ts";

import ErrorHandler from "./handler/ErrorHandler.ts";
import HomeResource from "./resource/HomeResource.ts";
import ConfigResource from "./resource/ConfigResource.ts";
import FilesResource from "./resource/FilesResource.ts";
import RoomResource from "./resource/RoomResource.ts";
import SocketResource from "./resource/SocketResource.ts";

export const loggerService = new LoggerService();

export const server = new Drash.Server({
    hostname: serverConfig.hostname,
    port: serverConfig.port,
    protocol: serverConfig.secure ? "https" : "http",
    error_handler: ErrorHandler,
    services: [
        loggerService,
        new PaladinService(),
        new ResponseTimeService(),
        // new CORSService({
        //     allowMethods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
        // })
    ],
    resources: [
        ConfigResource,
        FilesResource,
        HomeResource,
        RoomResource,
        SocketResource
    ],
});
import {CORSService, Drash, PaladinService, ResponseTimeService} from "./deps.ts";
import LoggerService from "./service/LoggerService.ts";
import {appServerConfig} from "./config.ts";

import FrontResource from "./resource/FrontResource.ts";
import FilesResource from "./resource/FilesResource.ts";

import ErrorHandler from "./handler/ErrorHandler.ts";
import GitHookResource from "./resource/GitHookResource.ts";
import ConfigResource from "./resource/ConfigResource.ts";
import RoomResource from "./resource/RoomResource.ts";
import SocketResource from "./resource/SocketResource.ts";

export const loggerService = new LoggerService();

export const server = new Drash.Server({
    hostname: appServerConfig.hostname,
    port: appServerConfig.port,
    protocol: appServerConfig.secure ? "https" : "http",
    error_handler: ErrorHandler,
    services: [
        loggerService,
        new PaladinService(),
        new ResponseTimeService(),
        new CORSService()
    ],
    resources: [
        FrontResource, // MUST BE THE FIRST
        FilesResource,
        ConfigResource,
        GitHookResource,
        RoomResource,
        SocketResource
    ],
});
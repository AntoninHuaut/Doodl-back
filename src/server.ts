import {CORSService, Drash, PaladinService, ResponseTimeService} from "./deps.ts";
import LoggerService from "./service/LoggerService.ts";
import {appServerConfig} from "./config.ts";

import FrontResource from "./resource/FrontResource.ts";
import FilesResource from "./resource/FilesResource.ts";

import ErrorHandler from "./handler/ErrorHandler.ts";
import TimeResource from "./resource/TimeResource.ts";
import ConfigResource from "./resource/ConfigResource.ts";
import RoomResource from "./resource/RoomResource.ts";
import GameSocketResource from "./resource/socket/GameSocketResource.ts";
import AdminSocketResource from "./resource/socket/AdminSocketResource.ts";

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

        TimeResource,
        FilesResource,
        ConfigResource,
        RoomResource,
        GameSocketResource,
        AdminSocketResource
    ],
});
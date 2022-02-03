import { Drash, z } from "../deps.ts";
import { roomConfig } from "../config.ts";
import { IRoomConfig, IRoomStatus, GameMode } from "../model/GameModel.ts";
import InvalidParameterValue from "../model/exception/InvalidParameterValue.ts";
import { createRoom, getRoomById } from '../core/RoomManager.ts';

interface IRoomPostRequest {
    config: IRoomConfig;
}

interface IRoomPostResponse {
    roomId: string;
}

interface IRoomGetResponse {
    roomId: string;
    config: IRoomConfig;
    status: IRoomStatus;
}

const RoomPostRequestSchema: z.ZodSchema<IRoomPostRequest> = z.object({
    config: z.object({
        gameMode: z.string(),
        timeByTurn: z.number(),
        maxPlayer: z.number()
    })
});

export default class HomeResource extends Drash.Resource {

    public paths = ["/room/:roomId?"];

    public GET(request: Drash.Request, response: Drash.Response) {
        const roomId: string | undefined = request.pathParam("roomId");
        const room = getRoomById(roomId);
        if (!room) throw new Drash.Errors.HttpError(404, `No room exist for id ${roomId}`);

        const jsonResponse: IRoomGetResponse = {
            roomId: room.roomId,
            config: room.config,
            status: room.status
        };

        return response.json(jsonResponse);
    }

    public POST(request: Drash.Request, response: Drash.Response) {
        const jsonRequest: IRoomPostRequest = RoomPostRequestSchema.parse(request.bodyAll());
        const gameMode: string = jsonRequest.config.gameMode;
        const maxPlayer: number = jsonRequest.config.maxPlayer;
        const timeByTurn: number = jsonRequest.config.timeByTurn;
        checkValidPOST(gameMode, maxPlayer, timeByTurn);

        const room = createRoom(GameMode[gameMode as keyof typeof GameMode], maxPlayer, timeByTurn);
        const jsonResponse: IRoomPostResponse = {
            roomId: room.roomId
        };

        return response.json(jsonResponse, 201);
    }

    public OPTIONS(_request: Drash.Request, _response: Drash.Response) {
    }
}

function checkValidPOST(gameMode: string, maxPlayer: number, timeByTurn: number) {
    checkValidRoomMode(gameMode);
    checkValidMaxPlayer(maxPlayer);
    checkValidTimeByTurn(timeByTurn);
}

function checkValidRoomMode(gameMode: string) {
    if (!(gameMode in GameMode)) {
        throw new InvalidParameterValue("gamemode")
    }
}

function checkValidMaxPlayer(maxPlayer: number) {
    if (maxPlayer < roomConfig.minMaxPlayer || maxPlayer > roomConfig.maxMaxPlayer) {
        throw new InvalidParameterValue(`maxPlayer (${roomConfig.minMaxPlayer}-${roomConfig.maxMaxPlayer})`);
    }
}

function checkValidTimeByTurn(timeByTurn: number) {
    if (timeByTurn < roomConfig.minTimeByTurn || timeByTurn > roomConfig.maxTimeByTurn) {
        throw new InvalidParameterValue(`timeByTurn (${roomConfig.minTimeByTurn}-${roomConfig.maxTimeByTurn})`);
    }
}
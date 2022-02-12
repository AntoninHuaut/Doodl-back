import { Drash } from "../deps.ts";
import { IRoomStatus, IRoomConfig } from '../model/GameModel.ts';
import { createRoom, getRoomById } from '../core/RoomManager.ts';

interface IRoomPostResponse {
    roomId: string;
}

interface IRoomGetResponse {
    roomId: string;
    config: IRoomConfig;
    status: IRoomStatus;
}

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

    public POST(_request: Drash.Request, response: Drash.Response) {
        const room = createRoom();
        const jsonResponse: IRoomPostResponse = {
            roomId: room.roomId
        };

        return response.json(jsonResponse, 201);
    }

    public OPTIONS(_request: Drash.Request, _response: Drash.Response) {
    }
}
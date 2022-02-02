import { Drash } from "../deps.ts";
import { roomConfig } from '../config.ts';

export default class ConfigResource extends Drash.Resource {

    public paths = [
        "/config"
    ];

    public GET(request: Drash.Request, response: Drash.Response) {
        return response.json(roomConfig);
    }
}
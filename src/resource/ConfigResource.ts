import { Drash } from "../deps.ts";
import { roomConfig } from '../config.ts';

export default class ConfigResource extends Drash.Resource {

    public paths = [
        "/config"
    ];

    public GET(_request: Drash.Request, response: Drash.Response) {
        return response.json(roomConfig);
    }

    public OPTIONS(_request: Drash.Request, response: Drash.Response) {
        return response.html("");
    }
}
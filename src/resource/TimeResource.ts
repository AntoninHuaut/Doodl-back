import {Drash} from "../deps.ts";

interface TimeResponse {
    date: Date;
}

export default class TimeResource extends Drash.Resource {

    public paths = [
        "/time"
    ];

    public GET(_request: Drash.Request, response: Drash.Response) {
        const jsonResponse: TimeResponse = {
            date: new Date()
        }
        return response.json(jsonResponse);
    }

    public OPTIONS(_request: Drash.Request, _response: Drash.Response) {
    }
}
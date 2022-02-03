import { Drash } from "../deps.ts";

export default class OptionsResource extends Drash.Resource {

    public paths = ["/.*"];

    public OPTIONS(_request: Drash.Request, response: Drash.Response): void {
        return response.html("");
    }
}
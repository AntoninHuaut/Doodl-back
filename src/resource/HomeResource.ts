import { Drash } from "../deps.ts";

export default class HomeResource extends Drash.Resource {

    public paths = ["/"];

    public GET(_request: Drash.Request, response: Drash.Response): void {
        return response.file("./public/index.html");
    }
}
import { Drash } from "../deps.ts";

export default class HomeResource extends Drash.Resource {

    public paths = ["/"];

    public GET(request: Drash.Request, response: Drash.Response): void {
        return response.file("./public/index.html");
    }
}
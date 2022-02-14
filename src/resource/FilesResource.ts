import {Drash} from "../deps.ts";

export default class FilesResource extends Drash.Resource {

    public paths = [
        "/favicon.ico",
        "/public/.*\.(html|txt|ico|jpg|png|gif|svg|css|js|json|map)",
    ];

    public GET(request: Drash.Request, response: Drash.Response) {
        let path = new URL(request.url).pathname;
        if (path === '/favicon.ico') {
            path = '/public' + path;
        }

        return response.file(`.${path}`);
    }
}
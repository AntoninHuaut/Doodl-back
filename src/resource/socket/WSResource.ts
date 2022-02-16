import {Drash} from "../../deps.ts";

export default abstract class WSResource extends Drash.Resource {

    public paths: string[];
    private readonly serverToken: string | undefined;

    protected constructor(config: {
        paths: string[];
        token?: string;
    }) {
        super();
        this.paths = config.paths;
        this.serverToken = config.token;
    }

    public GET(request: Drash.Request, response: Drash.Response): void {
        const clientToken = request.queryParam("token");
        if (this.serverToken && this.serverToken !== clientToken) throw new Drash.Errors.HttpError(403);

        if (request.headers.has("connection") && request.headers.has("upgrade") &&
            request.headers.get("connection")!.toLowerCase().includes("upgrade") &&
            request.headers.get("upgrade")!.toLowerCase() === "websocket") {
            try {
                const {socket, response: socketResponse} = Deno.upgradeWebSocket(request);
                this.addEventHandlers(socket);
                return response.upgrade(socketResponse);
            } catch (error) {
                return response.text(error);
            }
        }

        return response.json({
            error: "Invalid headers"
        });
    }

    protected abstract addEventHandlers(socket: WebSocket): void;
}
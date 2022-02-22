import {Drash, z} from "../../deps.ts";
import {IErrorSocketMessageResponse} from "../../model/GlobalSocketModel.ts";

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

    safeOnSocketMessage<T>(genSocket: T,
                           rawData: string,
                           parseSocketMessage: () => void,
                           sendMessage: (socket: T, msg: string) => void) {
        let jsonRawData;
        try {
            jsonRawData = JSON.parse(rawData);
            parseSocketMessage();
        } catch (error) {
            let errorResponse: z.ZodIssue[] | string;

            if (error instanceof z.ZodError) {
                errorResponse = error.issues;
            } else {
                errorResponse = error.name;
            }

            const objRes: IErrorSocketMessageResponse = {channel: "UNKNOWN", error: errorResponse};
            if (jsonRawData?.channel) {
                objRes.channel = jsonRawData.channel;
            }
            sendMessage(genSocket, JSON.stringify(objRes));
        }
    }

    protected abstract addEventHandlers(socket: WebSocket): void;

    protected getErrorToPrint(e: Event | ErrorEvent) {
        return e instanceof ErrorEvent ? {
            message: e.message ?? "Unknown message",
            filename: e.filename ?? "Unknown filename",
            lineno: e.lineno ?? "Unknown lineno",
            colno: e.colno ?? "Unknown colno",
            error: e.error ?? "Unknown error",
            stack: e.error?.stack ?? "Unknown error.stack"
        } : e;
    }
}
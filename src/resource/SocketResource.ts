import { Drash, z } from "../deps.ts";
import { ISocketMessageRequest, SocketChannel } from '../model/SocketModel.ts';

const SocketMessageRequestSchema: z.ZodSchema<ISocketMessageRequest> = z.object({
    channel: z.nativeEnum(SocketChannel),
    data: z.object({
        roomId: z.string(),
        name: z.string(),
        imgUrl: z.string()
    })
});

export default class SocketResource extends Drash.Resource {
    public paths = ["/ws"];

    public GET(request: Drash.Request, response: Drash.Response): void {
        if (request.headers.has("connection") && request.headers.has("upgrade") &&
            request.headers.get("connection")!.toLowerCase().includes("upgrade") &&
            request.headers.get("upgrade")!.toLowerCase() === "websocket") {
            try {
                const { socket, response: socketResponse } = Deno.upgradeWebSocket(request);
                this.#addEventHandlers(socket);
                return response.upgrade(socketResponse);
            } catch (error) {
                console.log(error);
                return response.text(error);
            }
        }

        return response.json({
            error: "Invalid headers"
        });
    }

    #addEventHandlers(socket: WebSocket): void {
        socket.onopen = () => {
            console.log("WebSocket connection opened!");
        };

        socket.onmessage = (e: MessageEvent) => {
            let jsonRequest: ISocketMessageRequest | null = null;
            let errorResponse: z.ZodIssue[] | string | null = null;
            try {
                jsonRequest = SocketMessageRequestSchema.parse(JSON.parse(e.data));
            } catch (error) {
                jsonRequest = null;
                if (error instanceof z.ZodError) {
                    errorResponse = error.issues;
                } else {
                    errorResponse = error.name;
                }
            }

            try {
                if (!jsonRequest) {
                    socket.send(JSON.stringify({
                        error: errorResponse ?? "Unexcepted error"
                    }));
                } else {
                    socket.send(JSON.stringify(jsonRequest, null, 2));
                }
            } catch (error) {
                console.error(error); // TODO LOG
            }
        };

        socket.onclose = () => {
            console.log("Connection closed.");
        };

        socket.onerror = (e: Event) => {
            console.error("WebSocket error:", e);
        };
    }
}
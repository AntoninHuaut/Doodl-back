import { Drash } from "../deps.ts";

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
            console.log(`Message received:`, e.data);
            try {
                socket.send(`We received your message! You sent: ${e.data}`);
            } catch (error) {
                console.error(error);
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
import {loggerService} from '../../server.ts';
import WSResource from "./WSResource.ts";

export default class AdminSocketResource extends WSResource {

    constructor() {
        super({
            token: Deno.env.get("WEBSOCKET_ADMIN_TOKEN"),
            paths: ["/adminws"]
        });
    }

    protected addEventHandlers(socket: WebSocket): void {
        try {
            socket.onopen = () => {
                loggerService.debug(`Open`);
            };

            socket.onmessage = (e: MessageEvent) => {
                loggerService.debug(`Message: ${e.data}`);
                socket.send(e.data);
            };

            socket.onclose = () => {
                loggerService.debug(`Close`);
            };

            socket.onerror = (e: Event | ErrorEvent) => {
                loggerService.debug(`Error: ${JSON.stringify(e)}`);
            }
        } catch (error) {
            loggerService.error(`Error: ${JSON.stringify(error.stack)}`);
        }
    }
}
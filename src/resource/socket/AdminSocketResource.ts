import {loggerService} from '../../server.ts';
import WSResource from "./WSResource.ts";
import {AdminSocketChannel, IAdminRoomInfo, IAdminSocketConnectResponse} from "../../model/AdminSocketModel.ts";
import {getRoomList} from "../../core/RoomManager.ts";
import {getSocketsCount} from "./GameSocketResource.ts";

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
                sendGlobalData(socket);
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

function sendGlobalData(socket: WebSocket) {
    const roomList: IAdminRoomInfo[] = getRoomList().map(room => {
        return {
            roomId: room.roomId,
            playerList: room.players
        }
    });

    const connectResponse: IAdminSocketConnectResponse = {
        channel: AdminSocketChannel.GLOBAL_DATA,
        data: {
            roomCount: roomList.length,
            wsCount: getSocketsCount(),
            roomList: roomList
        }
    };

    safeSend(socket, JSON.stringify(connectResponse));
}

function safeSend(socket: WebSocket, message: string) {
    try {
        socket.send(message);
    } catch (error) {
        loggerService.error(`WebSocket Admin - ${error.stack} `);
    }
}
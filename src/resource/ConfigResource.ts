import {Drash} from "../deps.ts";
import {appRoomConfig} from '../config.ts';
import {GameMode} from '../model/GameModel.ts';
import {IRoomServerConfig} from '../model/ConfigModel.ts';

interface ConfigResponse {
    gameMode: GameMode[];
    roomServerConfig: IRoomServerConfig;
}

export default class ConfigResource extends Drash.Resource {

    public paths = [
        "/config"
    ];

    public GET(_request: Drash.Request, response: Drash.Response) {
        const jsonResponse: ConfigResponse = {
            gameMode: Object.keys(GameMode) as GameMode[],
            roomServerConfig: appRoomConfig
        }
        return response.json(jsonResponse);
    }

    public OPTIONS(_request: Drash.Request, _response: Drash.Response) {
    }
}
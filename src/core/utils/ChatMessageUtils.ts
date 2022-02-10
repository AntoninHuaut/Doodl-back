import { IDataChatResponse } from '../../model/SocketModel.ts';
import { IPlayer } from '../../model/GameModel.ts';
import { roomConfig } from '../../config.ts';

export function getValidChatMessage(player: IPlayer, message: string): IDataChatResponse | undefined {
    if (!isValidMessage(message)) return undefined;

    return {
        message: message,
        author: {
            name: player.name,
            imgUrl: player.imgUrl
        },
        timestamp: new Date()
    }
}

function isValidMessage(message: string): boolean {
    if (!message.trim() || message.length > roomConfig.maxChatMessageLength) return false;

    // TODO

    return true;
}
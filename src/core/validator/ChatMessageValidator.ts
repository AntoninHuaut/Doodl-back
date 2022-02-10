import { IPlayer, IMessage } from '../../model/GameModel.ts';
import { roomConfig } from '../../config.ts';

export function getValidChatMessage(player: IPlayer, message: string): IMessage | undefined {
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
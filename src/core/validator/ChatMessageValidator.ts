import {IMessage, IPlayer} from '../../model/GameModel.ts';
import {appRoomConfig} from '../../config.ts';

export function getValidChatMessage(player: IPlayer, message: string): IMessage | undefined {
    if (!isValidMessage(message)) return undefined;

    return {
        message: message,
        author: player,
        timestamp: new Date()
    }
}

function isValidMessage(message: string): boolean {
    if (!message.trim() || message.length > appRoomConfig.maxChatMessageLength) return false;

    return true;
}
import { GameMode, IPlayer } from '../model/GameModel.ts';
import { Room } from '../model/Room.ts';
import { loggerService } from '../server.ts';

const ROOM_CODE_LENGTH = 9;
const roomMap = new Map<string, Room>();

export function createRoom(gameMode: GameMode, maxPlayer: number, roundTimeDuration: number): Room {
    const room = new Room(generateRoomId(), gameMode, maxPlayer, roundTimeDuration);
    loggerService.debug(`Creating room with id: ${room.roomId}`);
    roomMap.set(room.roomId, room);
    return room;
}

export function getRoomById(roomId: string | undefined): Room | undefined {
    if (!roomId) return undefined;

    return roomMap.get(roomId);
}

export function isRoomExist(roomId: string): boolean {
    return roomMap.has(roomId);
}

export function addPlayerToRoom(player: IPlayer, room: Room) {
    loggerService.debug(`Adding player (${player.playerId}) to room (${room.roomId})`);
    room.addPlayer(player);
}

export function removePlayerIdToRoom(playerId: string, room: Room) {
    loggerService.debug(`Removing player (${playerId}) to room (${room.roomId})`);
    room.removePlayerId(playerId);
}

function generateRoomId(): string {
    const roomId = Array(ROOM_CODE_LENGTH).fill('x').join('').replace(/x/g, () => {
        let num = Math.floor(Math.random() * 52);
        if (num > 25) num += 6
        return String.fromCharCode(num + 65)
    });

    if (roomMap.has(roomId)) {
        return generateRoomId();
    } else {
        return roomId;
    }
}
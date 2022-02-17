import {IPlayer} from '../model/GameModel.ts';
import {Room} from '../model/Room.ts';
import {loggerService} from '../server.ts';

const ROOM_CODE_LENGTH = 8;
const roomMap = new Map<string, Room>();

export function createRoom(): Room {
    const room = new Room(generateRoomId());
    loggerService.debug(`Creating room with id: ${room.roomId}`);
    roomMap.set(room.roomId, room);
    return room;
}

export function getRoomById(roomId: string | undefined): Room | undefined {
    if (!roomId) return undefined;

    return roomMap.get(roomId);
}

export function addPlayerToRoom(player: IPlayer, room: Room) {
    loggerService.debug(`Adding player (${player.playerId}) to room (${room.roomId})`);
    room.addPlayer(player);

    if (room.playerAdminId === undefined) {
        setAdmin(player.playerId, room);
    }
}

export function removePlayerIdToRoom(playerId: string, room: Room) {
    loggerService.debug(`Removing player (${playerId}) to room (${room.roomId})`);
    room.removePlayerId(playerId);

    if (room.playerAdminId === playerId) {
        if (room.players.length === 0) {
            loggerService.debug(`Room (${room.roomId}) no longer has an admin or players`);
            room.playerAdminId = undefined;
        } else {
            setAdmin(room.players[0].playerId, room);
        }
    }
}

export function startGame(room: Room) {
    loggerService.debug(`Start game (${room.roomId})`);
    room.startGame();
}

export function getRoomList(): Room[] {
    return Array.from(roomMap.values());
}

function setAdmin(playerId: string, room: Room) {
    loggerService.debug(`Player (${playerId}) is now admin of room (${room.roomId})`);
    room.playerAdminId = playerId;
}

/**
 * @returns string of ROOM_CODE_LENGTH length, including letters (upper) and digits
 */
function generateRoomId(): string {
    const roomId = Array(ROOM_CODE_LENGTH).fill('x').join('').replace(/x/g, () => {
        const possibleValue = ("Z".charCodeAt(0) - "A".charCodeAt(0) + 1) + ("9".charCodeAt(0) - "0".charCodeAt(0) + 1)
        let num = Math.floor(Math.random() * possibleValue) + "0".charCodeAt(0);
        if (num > "9".charCodeAt(0)) num += ("A".charCodeAt(0) - "9".charCodeAt(0) - 1)
        return String.fromCharCode(num)
    });

    if (roomMap.has(roomId)) {
        return generateRoomId();
    } else {
        return roomId;
    }
}
import { GameMode } from "../model/GameModel.ts";
import { Room } from '../model/Room.ts';

const ROOM_CODE_LENGTH = 9;
const roomList: Record<string, Room> = {};

export function createRoom(gameMode: GameMode, maxPlayer: number, roundTimeDuration: number): Room {
    const room = new Room(generateRoomId(), gameMode, maxPlayer, roundTimeDuration);
    roomList[room.roomId] = room;
    return room;
}

export function getRoomById(roomId: string | undefined): Room | undefined {
    if (!roomId) return undefined;

    return roomList[roomId];
}

function generateRoomId(): string {
    const roomId = Array(ROOM_CODE_LENGTH).fill('x').join('').replace(/x/g, () => {
        let num = Math.floor(Math.random() * 52);
        if (num > 25) num += 6
        return String.fromCharCode(num + 65)
    });

    if (roomId in roomList) {
        return generateRoomId();
    } else {
        return roomId;
    }
}
import {pokemon} from "../../data/pokemon.ts";
import {appRoomConfig} from "../config.ts";

export function getNbRandomWord(nb: number): string[] {
    const words: string[] = [];

    while (words.length < nb) {
        const word = getRandomWord();
        if (!words.includes(word)) {
            words.push(word);
        }
    }

    return words;
}

export function getRandomWord(): string {
    return getRandomWordFromArray(pokemon);
}

export function getRandomWordFromArray(words: string[]): string {
    return words[Math.floor((Math.random() * words.length))];
}

export function getGuessPointVariable(maxPointGuess: number, minPointGuess: number, startDrawDate: Date, endDrawDate: Date, guessDate: Date): number {
    const intervalDiff: number = new Date(endDrawDate.getTime() - startDrawDate.getTime()).getTime();
    let guessTimeRemainDiff: number = new Date(endDrawDate.getTime() - guessDate.getTime()).getTime();
    if (guessTimeRemainDiff < 0) guessTimeRemainDiff = 0;

    const guessPoint = minPointGuess + minPointGuess * guessTimeRemainDiff / intervalDiff;

    if (guessPoint > maxPointGuess) return maxPointGuess
    else if (guessPoint < minPointGuess) return minPointGuess;
    else return guessPoint;
}

export function getGuessPoint(startDrawDate: Date, endDrawDate: Date, guessDate: Date): number {
    return getGuessPointVariable(appRoomConfig.maxPointGuess, appRoomConfig.minPointGuess, startDrawDate, endDrawDate, guessDate);
}
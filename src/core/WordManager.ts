import {appRoomConfig} from "../config.ts";
import {WordList} from "../model/GameModel.ts";
import {loggerService} from "../server.ts";

export function getNbRandomWord(words: string[], nb: number): string[] {
    if (words.filter((w, idx) => words.indexOf(w) === idx).length < nb) return []; // With no duplicated

    const generatedWords: string[] = [];
    while (generatedWords.length < nb) {
        const word = getRandomWord(words);
        if (!generatedWords.includes(word)) {
            generatedWords.push(word);
        }
    }

    return generatedWords;
}

function getRandomWord(words: string[]): string {
    return getRandomWordFromArray(words);
}

export async function getWordList(wordList: WordList): Promise<string[]> {
    loggerService.debug(`WordManager::getWordList Loading "${"../../wordList/" + wordList.toLowerCase() + ".ts"}"`)
    try {
        return (await import("../../wordList/" + wordList.toLowerCase() + ".ts")).words;
    } catch (_err) {
        return [];
    }
}

export function getRandomWordFromArray(words: string[]): string {
    if (words.length === 0) return "Default";

    return words[Math.floor((Math.random() * words.length))];
}

export function revealOneLetter(word: string): string {
    let anonymeWord = word.replace(/./g, "_");

    let index = 0;
    for (const letter of word) {
        if (letter === ' ') {
            anonymeWord = setCharAt(anonymeWord, index, word[index])
        }
        index++;
    }

    let reveal = false;
    while (!reveal) {
        const indexToReveal = Math.floor((Math.random() * word.length));
        if (word[indexToReveal] !== ' ') {
            anonymeWord = setCharAt(anonymeWord, indexToReveal, word[indexToReveal])
            reveal = true;
        }
    }

    return anonymeWord;
}


function setCharAt(str: string, index: number, chr: string) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
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
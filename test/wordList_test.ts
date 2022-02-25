import {getWordList} from "../src/core/WordManager.ts";
import {WordList} from "../src/model/GameModel.ts";
import {assert} from "https://deno.land/std@0.125.0/_util/assert.ts";

Deno.test("Word list", async (t) => {
    await t.step({
        name: "Load pokemon list",
        fn: async () => {
            const array = await getWordList(WordList.POKEMON);
            assert(Array.isArray(array));
            assert(array.length > 0);
        }
    });
});
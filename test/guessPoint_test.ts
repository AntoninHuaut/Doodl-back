import {assertEquals} from "https://deno.land/std@0.125.0/testing/asserts.ts";
import {getGuessPointVariable} from "../src/core/WordManager.ts";

const d = (n: number) => new Date(n)
const check = getGuessPointVariable;

Deno.test("Guess point", async (t) => {
    await t.step({
        name: "Guess date == start draw date",
        fn: () => assertEquals(check(1000, 500, d(100), d(700), d(100)), 1000)
    });

    await t.step({
        name: "Guess date == end round date",
        fn: () => assertEquals(check(1000, 500, d(100), d(700), d(700)), 500)
    });

    await t.step({
        name: "Guess date = 1/2 * start draw date",
        fn: () => assertEquals(check(1000, 500, d(100), d(700), d(400)), 750)
    });

    await t.step({
        name: "Guess date = 1/4 * end round date",
        fn: () => assertEquals(check(1000, 500, d(0), d(1000), d(250)), 875)
    });
});
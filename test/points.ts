import {assertEquals} from "https://deno.land/std@0.97.0/testing/asserts.ts";
import {getGuessPointVariable} from "../src/core/WordManager.ts";

Deno.test("Guess point", () => {
    const d = (n: number) => new Date(n)
    const check = getGuessPointVariable;

    assertEquals(check(1000, 500, d(100), d(700), d(100)), 1000);
    assertEquals(check(1000, 500, d(100), d(700), d(700)), minP);
    assertEquals(check(1000, 500, d(100), d(700), d(400)), 750);
    assertEquals(check(1000, 500, d(0), d(1000), d(250)), 875);
});
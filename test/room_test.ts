import {appServerConfig} from "../src/config.ts";
import {assertExists} from "https://deno.land/std@0.125.0/testing/asserts.ts";

let roomId: string | undefined;

await Deno.test("Create room", async () => {
    roomId = await (fetch(`http://localhost:${appServerConfig.port}/room`, {
        method: 'POST'
    }).then(res => res.json()).then(res => res.roomId));

    assertExists(roomId, "Room created");
});
import {server} from "./server.ts";

if (!Deno.env.get("WEBSOCKET_ADMIN_TOKEN")) {
    console.error("[ERROR] Invalid WebSocket Admin Token");
    Deno.exit(-1);
}

server.run();
console.log(`Server running at ${server.address}.`);
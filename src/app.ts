import {server} from "./server.ts";

server.run();
console.log(`Server running at ${server.address}.`);
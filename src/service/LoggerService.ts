import { Drash, unilogger } from "../deps.ts";

export class LoggerService extends Drash.Service {

    #timeEnd = 0;
    #timeStart = 0;

    public loggers: (unilogger.ConsoleLogger | unilogger.FileLogger)[];

    constructor() {
        super();
        this.loggers = [new unilogger.ConsoleLogger({}), new unilogger.FileLogger({ file: "app.log" })];
    }

    runBeforeResource(request: Drash.Request, _response: Drash.Response) {
        this.#timeStart = new Date().getTime();
        const message = `${request.method.toUpperCase()} ${new URL(request.url).pathname} | Request received`;
        this.loggers.forEach((logger) => logger.info(message));
    }

    runAfterResource(request: Drash.Request, _response: Drash.Response) {
        this.#timeEnd = new Date().getTime();
        const message = `${request.method.toUpperCase()} ${new URL(request.url).pathname}`
            + ` | Response sent [${getTime(this.#timeEnd, this.#timeStart)}]`;
        this.loggers.forEach((logger) => logger.info(message));
    }
}

function getTime(end: number, start: number): string {
    return `${end - start} ms`;
}

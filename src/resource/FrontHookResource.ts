import { Drash } from "../deps.ts";
import { loggerService } from '../server.ts';

export default class FrontHookResource extends Drash.Resource {

    public paths = ["/fronthook"];

    public GET(request: Drash.Request, response: Drash.Response): void {
        const serverFrontToken = Deno.env.get("FRONT_TOKEN");
        if (!serverFrontToken) throw new Drash.Errors.HttpError(404);
        const userFrontToken = request.queryParam("frontToken");

        if (serverFrontToken !== userFrontToken) throw new Drash.Errors.HttpError(404);

        setTimeout(async () => {
            loggerService.info("Front Hook, deploying...")
            const p = Deno.run({ cmd: ["./deployFront.sh"] });
            const { success, code, signal } = await p.status();
            loggerService.info(`Front Hook, ${success} - ${code} - ${signal}`);
        }, 100);

        response.json({
            status: "OK"
        });
    }
}
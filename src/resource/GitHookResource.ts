import { Drash } from "../deps.ts";
import { loggerService } from '../server.ts';

export default class GitHookResource extends Drash.Resource {

    public paths = ["/githook"];

    public POST(request: Drash.Request, response: Drash.Response): void {
        const serverBackToken = Deno.env.get("BACK_GITLAB_TOKEN");
        const serverFrontToken = Deno.env.get("FRONT_GITLAB_TOKEN");
        if (!serverBackToken || !serverFrontToken) throw new Drash.Errors.HttpError(404);

        const userGitlabToken = request.headers.get("X-Gitlab-Token");

        const deployBack = serverBackToken === userGitlabToken;
        const deployFront = serverFrontToken === userGitlabToken;

        if (!deployBack && !deployFront) throw new Drash.Errors.HttpError(404);

        response.headers.set("Accept", "application/vnd.contentful.management.v1+json");

        setTimeout(async () => {
            let p;
            if (deployBack) {
                loggerService.info(`Back Hook, deploying...`)
                p = Deno.run({ cmd: ["./deployBack.sh"] });
            }
            if (deployFront) {
                loggerService.info(`Front Hook, deploying...`)
                p = Deno.run({ cmd: ["./deployFront.sh"] });
            }

            if (!p) return;

            const { success, code, signal } = await p.status();
            loggerService.info(`Hook, ${success} - ${code} - ${signal}`);
        }, 100);
    }
}
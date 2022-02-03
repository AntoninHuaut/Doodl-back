import { Drash } from "../deps.ts";
import { loggerService } from '../server.ts';

export default class GitHookResource extends Drash.Resource {

    public paths = ["/githook"];

    public POST(request: Drash.Request, response: Drash.Response): void {
        const serverGitlabToken = Deno.env.get("GITHOOK_GITLAB_TOKEN");
        if (!serverGitlabToken) throw new Drash.Errors.HttpError(404);
        const userGitlabToken = request.headers.get("X-Gitlab-Token");

        if (serverGitlabToken !== userGitlabToken) throw new Drash.Errors.HttpError(404);

        response.headers.set("Accept", "application/vnd.contentful.management.v1+json");
        setTimeout(async () => {
            loggerService.info("Git Hook, deploying...")
            const p = Deno.run({ cmd: ["./deploy.sh"] });
            const { success, code, signal } = await p.status();
            loggerService.info(`Git Hook, ${success} - ${code} - ${signal}`);
        }, 100);
    }
}
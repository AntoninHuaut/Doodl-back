import { Drash } from "../deps.ts";
import { loggerService } from '../server.ts';

export default class GitHookResource extends Drash.Resource {

    public paths = ["/githook"];

    public async GET(request: Drash.Request, _response: Drash.Response): Promise<void> {
        const serverGitlabToken = Deno.env.get("GITHOOK_GITLAB_TOKEN");
        if (!serverGitlabToken) return;
        const userGitlabToken = request.headers.get("X-Gitlab-Token");

        if (serverGitlabToken !== userGitlabToken) throw new Drash.Errors.HttpError(404);

        loggerService.info("Git Hook, deploying...")
        const p = Deno.run({ cmd: ["./deploy.sh"] });
        const { success, code, signal } = await p.status();
        loggerService.info(`Git Hook, ${success} - ${code} - ${signal}`);
    }
}
import {Drash, z} from "../deps.ts";
import InvalidParameterValue from '../model/exception/InvalidParameterValue.ts';
import {loggerService} from '../server.ts';

export default class ErrorHandler extends Drash.ErrorHandler {

    public catch(error: Error, _request: Request, response: Drash.Response): void {
        let code = 500;
        let message: string | z.ZodError = "Server failed to process the request.";

        if (error instanceof InvalidParameterValue) {
            code = 400;
            message = `Invalid parameter value: ${error.message}`;
        } else if (error instanceof z.ZodError) {
            code = 400;
            message = error;
        } else if (error instanceof Drash.Errors.HttpError) {
            code = error.code;
            message = error.message;
        }

        if (code == 500) {
            loggerService.error(error.stack);
        }

        return response.json({
            error: message,
        }, code);
    }
}
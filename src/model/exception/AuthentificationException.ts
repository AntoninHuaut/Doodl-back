export default class AuthentificationException extends Error {

    constructor(message: string) {
        super();
        this.message = message;
        this.name = 'AuthentificationException';
    }
}
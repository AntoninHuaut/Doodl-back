export default class InvalidState extends Error {

    constructor(message: string) {
        super();
        this.message = message;
        this.name = 'InvalidState';
    }
}
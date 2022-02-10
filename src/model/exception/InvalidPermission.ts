export default class InvalidPermission extends Error {

    constructor(message: string) {
        super();
        this.message = message;
        this.name = 'InvalidPermission';
    }
}
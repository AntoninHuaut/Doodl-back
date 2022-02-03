export default class InvalidParameterValue extends Error {

    constructor(message: string) {
        super();
        this.message = message;
        this.name = 'InvalidParameterValue';
    }
}
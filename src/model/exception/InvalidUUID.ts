export default class InvalidUUID extends Error {

    constructor() {
        super();
        this.message = "Invalid UUID";
        this.name = 'InvalidUUID';
    }
}
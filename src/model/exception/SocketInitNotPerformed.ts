export default class SocketInitNotPerformed extends Error {

    constructor() {
        super();
        this.message = "The player initialization of the socket has not been performed";
        this.name = 'SocketInitNotPerformed';
    }
}
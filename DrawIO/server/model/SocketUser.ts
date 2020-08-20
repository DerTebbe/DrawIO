import {User} from './user';
import {Socket} from "socket.io";

export interface SocketUser {
    socket: Socket;
    user: User;
}

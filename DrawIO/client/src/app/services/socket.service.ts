import { Injectable } from '@angular/core';
import {Socket} from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  socket: Socket;
  constructor(private socketTemp: Socket) {
    this.socket = socketTemp;
  }
}

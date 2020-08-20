import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {SocketService} from '../services/socket.service';
import {Message} from '../models/Message';
import {LoginService} from '../services/login.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @Input() roomID: number;
  @ViewChild('chatRef', {static: true})
  chat: ElementRef<HTMLInputElement>;
  text = '';
  messages: Message[] = [];

  constructor(public socketService: SocketService, public loginService: LoginService) {
    this.socketService.socket.on('message', (message: Message) => {
      console.log('RECEIVED');
      this.messages.push(message);
    });
  }

  sendMessage(): void {
    const message: Message = {user: this.loginService.loggedInUser, text: this.text, date: null, roomID: this.roomID};
    this.socketService.socket.emit('message', message);
    this.text = '';
  }

  ngOnInit() {
  }

}

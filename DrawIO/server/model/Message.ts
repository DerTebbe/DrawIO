import {User} from './UserClient';

export interface Message {
  user: User;
  text: string;
  date: Date;
  roomID: number;
}

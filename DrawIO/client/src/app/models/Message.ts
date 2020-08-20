import {User} from './User';

export interface Message {
  user: User;
  text: string;
  date: Date;
  roomID: number;
}

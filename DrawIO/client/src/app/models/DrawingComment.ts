import {User} from "./User";

export class DrawingComment {
  public author:User;
  public comment:string;
  public timestamp:Date;

  constructor(author: User, comment: string, timestamp: Date) {
    this.author = author;
    this.comment = comment;
    this.timestamp = timestamp;
  }
}

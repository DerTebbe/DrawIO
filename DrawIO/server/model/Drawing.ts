import {User} from "./UserClient";
import {DrawingComment} from "./DrawingComment";

export class Drawing {
  public id: string;
  public title: string;
  public description: string;
  public authors: User[];
  public comments: DrawingComment[] = [];
  public timestamp: Date;
  public imageData_b64: string;


  constructor(title: string, description: string, authors: User[], timestamp: Date, imageData_b64: string) {
    this.title = title;
    this.description = description;
    this.authors = authors;
    this.timestamp = timestamp;
    this.imageData_b64 = imageData_b64;
  }
}

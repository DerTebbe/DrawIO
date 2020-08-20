// Class representing a user
import {Rights} from './Rights';

export class User {
  public id: string;
  public username: string;
  public firstName: string;
  public lastName: string;
  public creationDate: Date;
  public rights: Rights;

  constructor(id: string, username: string, firstName: string, lastName: string, creationDate: Date, rights: Rights) {
    this.id = id;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.creationDate = creationDate;
    this.rights = rights;
  }
}

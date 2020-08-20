import { Rights } from './rights';

// Class representing a user
export class User {
    public id: string;
    public username: string;
    public password: string;
    public firstName: string;
    public lastName: string;
    public creationDate: Date;
    public rights: Rights;

    constructor(username: string, password: string, firstName: string, lastName: string, creationDate: Date, rights: Rights) {
        this.username = username;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.creationDate = creationDate;
        this.rights = rights;
    }
}

import {Injectable} from '@angular/core';
import {User} from '../models/User';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {AlertService} from './alert.service';
import {environment} from '../../environments/environment';
import {Rights} from "../models/Rights";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  userList: User[] = [];
  editUser: User;
  constructor(private httpClient: HttpClient, private alertService: AlertService) {}

  /*getAll() {
    this.httpClient.get(`${environment.apiUrl}/users`)
      .toPromise()
      .then((response: any) => {
        this.userList = response.userList;
      })
      .catch((err) => {
        console.log(err);
      });*/
  getAll(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/users`)
        .toPromise()
        .then((response: any) => {
          this.userList = response.userList;
          resolve(this.userList);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });

  }

  async get(id: string): Promise<User> {
    return new Promise((resolve, reject) => {
        this.httpClient.get(`${environment.apiUrl}/user/${id}`)
          .toPromise()
          .then((response: any) => {
            resolve(response.user);
          })
          .catch((err) => {
            reject(err);
          });
    });
  }

  create(firstName: string, lastName: string, username: string, password: string, noLogin: boolean, rights= Rights.User): Promise<string> {
    return new Promise<string>((resolve) => {
      this.httpClient.post(`${environment.apiUrl}/user`, {
        firstName: firstName,
        lastName: lastName,
        username: username,
        password: password,
        rights: rights,
        noLogin: noLogin
      })
        .toPromise()
        .then((response: any) => {
          this.alertService.addAlert({type: 'success', message: 'User erfolgreich hinzugefügt'});
          //this.getAll();
          resolve(response.userId);
        }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.error.message});
      });
    });
  }

  delete(user: User): void {
    this.httpClient.delete(`${environment.apiUrl}/user/${user.id}`)
      .toPromise()
      .then((response: any) => {
        this.alertService.addAlert({type: 'success', message: 'User erfolgreich gelöscht'});
        this.getAll();
      })
      .catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
      });
  }

  edit(user: User, password: string): Promise<void> {
    if (!user.rights) {user.rights = Rights.User}
    return new Promise<void>((resolve) => {
      this.httpClient.put(`${environment.apiUrl}/user/${user.id}`, {
        user,
        password
      }).toPromise().then((response: any) => {
          this.alertService.addAlert({type: 'success', message: 'Änderungen erfolgreich gespeichert!'});
          resolve();
        })
        .catch((err: HttpErrorResponse) => {
          this.alertService.addAlert({type: 'danger', message: err.message});
        });
    });
  }

  getRoomUsers(roomID: number): Promise<User[]> {
    return new Promise<User[]>((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/getUsers/${roomID}`).toPromise().then((value: any) => {
        resolve(value.users);
      }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
        reject();
      });
    });
  }
}

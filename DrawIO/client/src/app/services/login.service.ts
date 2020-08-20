import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {User} from '../models/User';
import {UserService} from './user.service';
import {Rights} from '../models/Rights';
import {Location} from '@angular/common';
import {AlertService} from "./alert.service";
import {Router} from "@angular/router";
import {environment} from '../../environments/environment';
import {SocketService} from "./socket.service";
import {Socket} from "ngx-socket-io";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  loggedInUser: User;

  constructor(private httpClient: HttpClient,
              private userService: UserService,
              private alertService: AlertService,
              private location: Location,
              private router: Router) {
    this.getLogin().catch(() => {});
  }

  login(username: string, password: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.httpClient.post(`${environment.apiUrl}/login`, {username, password})
        .toPromise()
        .then((response: any) => {
          this.loggedInUser = response.user;
          this.alertService.addAlert({type: 'success', message: 'Login erfolgreich!'});resolve(response.user);
        })
        .catch((err) => {
          this.alertService.addAlert({type: 'danger', message: err.message});
          reject(err);
        });
    });
  }

  getLogin(): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/login`)
        .toPromise()
        .then((response: any) => {
          this.loggedInUser = response.user;
          resolve(response.user)
        })
        .catch((err) => {
          reject(err)
        });
    });
  }

  isLoggedIn(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/login`)
        .toPromise()
        .then((response: any) => {
          resolve(true);
        })
        .catch((err) => {
          reject(false);
        });
    });
  }

  logout() {
    this.httpClient.post(`${environment.apiUrl}/logout`, {})
      .toPromise()
      .then((response: any) => {
        this.loggedInUser = null;
        this.router.navigateByUrl('/');
        this.alertService.addAlert({type: 'success', message: 'Logout erfolgreich!'})
      })
      .catch((err: HttpErrorResponse) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
      });
  }

  hasRights(right: Rights): boolean {
    return this.loggedInUser && this.loggedInUser.rights >= right;
  }

  hasRights1(right: Rights): Promise<boolean> {
    return new Promise((resolve, reject) => {
      resolve(true);
    })

  }

  async getLoginHistory(skip: number, limit: number) {
    return new Promise<{ user: User, date: Date }[]>(((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/stats/login/history/${skip}/${limit}`)
        .toPromise()
        .then((response: any) => {
          resolve(response.loginHistory);
        })
        .catch((err) => {
          this.alertService.addAlert({type: 'danger', message: err.message});
          reject(err);
        });
    }));
  }

  logoutAndDelete(id: string): Promise<any> {
    return new Promise<any>((resolve) => {
      this.httpClient.delete(`${environment.apiUrl}/user/${id}`).toPromise().then((res: any) => {
        this.loggedInUser = null;
        this.router.navigate(['/']);
        this.alertService.addAlert({type: 'success', message: res.message});
      }).catch((err: any) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
      });
    });
  }

  delete(id: string, logout = false): Promise<any> {
    return new Promise<any>(() => {
      this.httpClient.delete(`${environment.apiUrl}/user/${id}`).toPromise().then((res: any) => {
        this.alertService.addAlert({type: 'success', message: res.message});
        if (logout) {
          this.logout();
        }
      }).catch((err: any) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
      });
    });
  }
}

import { Injectable } from '@angular/core';
import {User} from "../models/User";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private httpClient: HttpClient) { }

  getTest(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/stats/users/test`)
        .toPromise()
        .then((response: any) => {
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  getAdmins(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/stats/users/admin`)
        .toPromise()
        .then((response: any) => {
          resolve(response.admins);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getCount(collectionName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/stats/count/${collectionName}`)
        .toPromise()
        .then((response: {message: string, count: number}) => {
          resolve(response.count);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async getLoginHistory(skip: number, limit: number) {
    return new Promise<{user: User, date: Date}[]>(((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/stats/login/history/${skip}/${limit}`)
        .toPromise()
        .then((response: any) => {
          resolve(response.loginHistory);
        })
        .catch((err) => {
          reject(err);
        });
    }));
  }
}

import {Injectable} from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  ParamMap, Router, ActivatedRoute
} from '@angular/router';
import {Observable} from 'rxjs';
import {SocketService} from "../services/socket.service";
import {log} from "util";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class RoomGuard implements CanActivate {
  constructor(public router: Router, public socketService: SocketService, private httpClient: HttpClient) {
  }
  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) {
    const roomIDString = next.paramMap.get('roomID');
    if (roomIDString) {
      const roomID: number = Number.parseInt(roomIDString, 10);
      if (!Number.isNaN(roomID)) {
        console.log(roomID);
        // HTTP REQUEST HERE
        try {
          await new Promise((resolve, reject) => {
            this.httpClient.get(`/checkRoom/${roomID}`).toPromise().then(() => {
              resolve();
            }).catch(() => {
              reject();
            });
          });
          return true;
        } catch {
          this.router.navigate(['/']);
          return false;
        }
      } else {
        this.router.navigate(['/']);
        return false;
      }
    }
  }
}

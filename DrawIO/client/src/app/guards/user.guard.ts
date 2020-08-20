import { Injectable } from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import {LoginService} from "../services/login.service";
import {Rights} from "../models/Rights";
import {AlertService} from "../services/alert.service";

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {
  constructor(private loginService: LoginService, private alertService: AlertService, private router: Router) {}
  async canActivate (
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot)  {
    try {
      await this.loginService.getLogin();
      if (this.loginService.hasRights(Rights.User)) {
        return true
      } else {
        await this.router.navigateByUrl("/");
        this.alertService.addAlert({message: "keine Berechtigung", type: "warning"});
        return false
      }
    } catch (e) {
      await this.router.navigateByUrl("/");
      this.alertService.addAlert({message: "Nicht autorisiert", type: "warning"});
      return false
    }
  }
}

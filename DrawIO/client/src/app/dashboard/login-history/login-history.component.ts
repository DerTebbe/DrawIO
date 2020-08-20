import { Component, OnInit } from '@angular/core';
import {LoginService} from "../../services/login.service";
import {User} from "../../models/User";
import {templateJitUrl} from "@angular/compiler";
import {StatsService} from "../../services/stats.service";
import {AlertService} from "../../services/alert.service";

@Component({
  selector: 'app-login-history',
  templateUrl: './login-history.component.html',
  styleUrls: ['./login-history.component.scss']
})
export class LoginHistoryComponent {

  loginHistory: {date: Date, user: User}[] = [];
  skip = 0;
  limit = 10;
  skipCounter = 1;
  constructor(private statsService: StatsService, private alertService: AlertService) {
    this.load()
  }
  load() {
    this.statsService.getLoginHistory(this.skip, this.limit)
      .then((result)=> {
      this.loginHistory = this.loginHistory.concat(result);
      this.limit = 10;
      this.skip = this.limit * this.skipCounter;
      this.skipCounter++;
    })
      .catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
      });
  }
  reset() {
    this.loginHistory = [];
    this.skip = 0;
    this.limit = 10;
    this.skipCounter = 1;
    this.load();
  }

}

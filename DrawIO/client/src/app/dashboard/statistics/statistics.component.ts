import { Component, OnInit } from '@angular/core';
import {StatsService} from "../../services/stats.service";
import {User} from "../../models/User";

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  userCount: number;
  imageCount: number;
  loginsCount: number;
  lastLogins: {date: Date, user: User}[];
  admins: User[];
  adminsCount: number;
  test;

  constructor(private statsService: StatsService) {
    this.getLastLogins();
    //this.getTest();
  }
  async ngOnInit() {
    this.userCount = await this.getCount("userlist");
    this.imageCount = await this.getCount("imagelist");
    this.loginsCount = await this.getCount("logins");
    this.getAdmins();

  }
  getCount(collectionName: string): Promise<number> {
    return new Promise((resolve) => {
      this.statsService.getCount(collectionName).then((res) => {
        resolve(res);
      }).catch((err) => {
        console.log(err)
      })
    })
  }
  getTest() {
    this.statsService.getTest().then((res: any) => {
      this.test = res;
      console.log(res)
    }).catch((err) => {
      console.log(err)
    })
  }
  getAdmins() {
    this.statsService.getAdmins().then((res: any) => {
      this.admins = res;
      this.adminsCount = res.length;
    }).catch((err) => {
      console.log(err)
    })
  }

  getLastLogins() {
    this.statsService.getLoginHistory(0, 5).then((res) => {
      this.lastLogins = res
    }).catch((err) => {
      console.log(err)
    })
  }

}

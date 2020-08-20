import { Injectable } from '@angular/core';
import {IAlert} from '../models/IAlert';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private alerts: IAlert[] = [];

  constructor() {}

  addAlert(alert: IAlert) {
    this.alerts.push(alert);
    setTimeout(() => {
      this.removeAlert(alert);
    }, 4000);
  }

  removeAlert(alert: IAlert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }

  getAlerts() {
    return this.alerts;
  }
}

import { Component } from '@angular/core';
import {Rights} from '../models/Rights';
import {LoginService} from '../services/login.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'DrawIO';
  Rights = Rights;
  constructor(public loginService: LoginService) {
    console.log('Production Environment: ' + environment.production);
  }
}

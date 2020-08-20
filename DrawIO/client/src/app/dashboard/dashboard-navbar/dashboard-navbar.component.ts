import {Component, Input, OnInit} from '@angular/core';
import {LoginService} from "../../services/login.service";
import {UserService} from "../../services/user.service";
import {Router} from "@angular/router";
import {Rights} from '../../models/Rights';

@Component({
  selector: 'app-dashboard-navbar',
  templateUrl: './dashboard-navbar.component.html',
  styleUrls: ['./dashboard-navbar.component.scss']
})
export class DashboardNavbarComponent implements OnInit {
  Rights = Rights;
  @Input() title: string;
  navbarOpen: boolean;
  constructor(
    public loginService: LoginService,
    private userService: UserService,
    public router: Router
  ) { }

  handleLogout() {
    this.loginService.logout();
    this.router.navigate(['/']);
  }
  ngOnInit() {
  }
}

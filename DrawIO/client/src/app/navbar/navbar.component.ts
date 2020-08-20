import {Component, Input} from '@angular/core';
import {LoginService} from '../services/login.service';
import {UserService} from '../services/user.service';
import {Rights} from '../models/Rights';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LoginModalComponent} from '../login-modal/login-modal.component';
import {RegisterModalComponent} from '../register-modal/register-modal.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent {

  @Input() title: string;

  Rights = Rights;
  username = '';
  password = '';
  isLoggedIn: boolean;
  navbarOpen: boolean;

  constructor(
    public loginService: LoginService,
    private userService: UserService,
    public router: Router,
    private modalService: NgbModal
  ) {
    this.isLoggedIn = false;
  }

  handleLogin() {
    this.loginService.login(this.username, this.password)
      .then(() => {
        this.isLoggedIn = true;
        if (this.loginService.hasRights(Rights.Admin)) {
          this.router.navigateByUrl('/dashbooard');
        }
      });
    this.username = '';
    this.password = '';
  }

  openLoginModal(): void {
    const modalReference = this.modalService.open(LoginModalComponent);
    modalReference.result.finally(() => {
        this.router.navigateByUrl('/');
    });
  }

  handleLogout() {
    this.loginService.logout();
    this.router.navigateByUrl('/');
    this.isLoggedIn = false;
  }

  openRegisterModal() {
    const modalReference = this.modalService.open(RegisterModalComponent);
    modalReference.result.then(() => {
      this.router.navigateByUrl('/profile');
    }).catch(() => {});
  }
}

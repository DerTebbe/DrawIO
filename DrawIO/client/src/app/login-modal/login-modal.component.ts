import {Component, OnInit} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LoginService} from '../services/login.service';
import {Rights} from '../models/Rights';
import {Router} from '@angular/router';
import {RegisterModalComponent} from "../register-modal/register-modal.component";

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent {

  link = `/auth/google`;
  Rights = Rights;
  public username: string;
  public password: string;

  constructor(public activeModal: NgbActiveModal, public loginService: LoginService, public router: Router, public modalService: NgbModal) {}

  handleLogin() {
    this.loginService.login(this.username, this.password)
      .then(() => {
        if (this.loginService.hasRights(Rights.Admin)) {
          this.router.navigate(['dashboard']);
        }
      });
    this.username = '';
    this.password = '';
    this.activeModal.dismiss();
  }

  onKeyUp(event) {
    if (event.key === 'Enter') {
      this.handleLogin();
    }
  }

  openRegisterModal() {
    this.activeModal.dismiss();
    const modalReference = this.modalService.open(RegisterModalComponent);
    modalReference.result.then(() => {
      this.router.navigateByUrl('/profile');
      console.log('Regulär geschlossen');
    }).catch(() => {
      console.log('Unregulär geschlossen');
    });
  }
}

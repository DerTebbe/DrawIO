import {Component, Input} from '@angular/core';
import {UserService} from "../services/user.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {LoginService} from "../services/login.service";
import {Rights} from "../models/Rights";

@Component({
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.scss']
})
export class RegisterModalComponent {

  username: string = '';
  firstName: string = '';
  lastName: string = '';
  password: string = '';
  confirmPassword: string = '';
  dataError = false;
  passwordError = false;
  checked = false;
  Rights = Rights;
  rights = Rights.User;
  @Input() noLogin = false;

  constructor(private userService: UserService, public activeModal: NgbActiveModal, public loginservice: LoginService) {}

  save() {
    this.checkForErrors();
    if (this.checked) {
      this.userService.create(this.firstName, this.lastName, this.username, this.password, this.noLogin , this.rights,).then(async (value: string) => {
      });
      this.activeModal.close();
    }
  }

  checkForErrors() {
    if (this.password !== this.confirmPassword) {
      this.passwordError = true;
      this.checked = false;
      setTimeout(() => {
        this.passwordError = false;
      }, 5000)
    }if (!(this.username.trim() && this.firstName.trim() && this.lastName.trim() && this.password.trim())) {
      this.dataError = true;
      this.checked = false;
      setTimeout(() => {
        this.dataError = false;
      }, 5000)
    }
    this.checked = ((this.username.trim() && this.firstName.trim() && this.lastName.trim() && this.password.trim()) && (this.password === this.confirmPassword));
  }
}

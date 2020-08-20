import {Component, OnInit} from '@angular/core';
import {User} from '../../models/User';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from '../../services/user.service';
import {Rights} from '../../models/Rights';

@Component({
  selector: 'app-dashboard-edit-user',
  templateUrl: './dashboard-edit-user.component.html',
  styleUrls: ['./dashboard-edit-user.component.scss']
})
export class DashboardEditUserComponent {

  Rights = Rights;
  public user: User;
  private error = false;
  password: string;

  constructor(public activeModal: NgbActiveModal,
              private userService: UserService) {
        this.user = this.userService.editUser;
  }

  save() {
    if (this.user.username.trim() && this.user.firstName.trim() && this.user.lastName.trim()) {
      this.user.username = this.user.username.trim();
      this.user.firstName = this.user.firstName.trim();
      this.user.lastName = this.user.lastName.trim();
      this.activeModal.close({user: this.user, password: this.password});
    } else {
      this.error = true;
      setTimeout(() => {
        this.error = false;
      }, 5000);
    }
  }
}

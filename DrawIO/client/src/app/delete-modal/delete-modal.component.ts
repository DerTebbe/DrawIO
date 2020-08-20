import {Component, Input} from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../services/user.service";
import {User} from "../models/User";

@Component({
  selector: 'app-delete-modal',
  templateUrl: './delete-modal.component.html',
  styleUrls: ['./delete-modal.component.scss']
})
export class DeleteModalComponent {

  @Input() public user: User;
  @Input() public admin: boolean = false;
  constructor(public activeModal: NgbActiveModal) {}

  delete() {
    this.activeModal.close();
  }
}

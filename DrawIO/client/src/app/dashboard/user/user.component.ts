import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, Router} from "@angular/router";
import {User} from "../../models/User";
import {UserService} from "../../services/user.service";
import {LoginService} from "../../services/login.service";
import {DeleteModalComponent} from "../../delete-modal/delete-modal.component";

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  @Input() user: User;
  @Output() refreshEvent: EventEmitter<void>;
  currentModal = null;

  constructor(
    private userService: UserService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    public loginService: LoginService,
  ) {
    this.refreshEvent = new EventEmitter<void>();
  }

  ngOnInit() {
  }

  openEditModal(): void {
    this.router.navigateByUrl('/dashboard/users/edit/' + this.user.id)
  }

  delete(): void {
    const modalReference = this.modalService.open(DeleteModalComponent);
    modalReference.componentInstance.user = this.user;
    modalReference.componentInstance.admin = true;
    modalReference.result.then(() => {
      this.loginService.delete(this.user.id, false).finally();
      this.refreshEvent.emit();
    }).catch(() => {
      console.log('Unregulär geschlossen')
    });
  }
}

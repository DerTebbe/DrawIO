import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {LoginService} from "../services/login.service";
import {Router} from "@angular/router";
import {Rights} from "../models/Rights";
import {RegisterModalComponent} from "../register-modal/register-modal.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ImageService} from "../services/image.service";
import {UserService} from "../services/user.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  toggled = false;
  image;
  constructor(public router: Router,
              private loginService: LoginService,
              private modalService: NgbModal,
              private imageService: ImageService,
              private userService: UserService,) {}
  ngOnInit() {

    if (!this.loginService.hasRights(Rights.Admin)) {
      // TODO beheben
       //this.router.navigate(['/']);
     }
  }
  openRegisterModal() {
    const modalReference = this.modalService.open(RegisterModalComponent);
    modalReference.componentInstance.noLogin = true;
    modalReference.result.then(() => {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigateByUrl('/dashboard/users');
      });
      console.log('Regulär geschlossen')
    }).catch(() => {
      console.log('Unregulär geschlossen')
    });
  }

}

import {Component, OnInit} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {DashboardEditUserComponent} from "../dashboard-edit-user/dashboard-edit-user.component";
import {UserService} from "../../services/user.service";
import {User} from "../../models/User";
import {AlertService} from "../../services/alert.service";

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.scss']
})
export class UserlistComponent implements OnInit {

  userlist: User[] = [];
  activeModal;

  constructor(
    private alertService: AlertService,
    private modalService: NgbModal,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router) {

    this.route.paramMap.subscribe(async (paramMap: ParamMap) => {
      const id = paramMap.get('id');
      if (id) {
        try {
          this.userService.editUser = await this.userService.get(id);
        } catch (e) {
          this.alertService.addAlert({message: "Nutzer konnte nicht gefunden werden", type: "warning"});
          await this.router.navigateByUrl('/dashboard/users');
        } try {
          this.activeModal = this.modalService.open(DashboardEditUserComponent);
          await this.activeModal.result.then((result: {user: User, password: string}) => {
            this.userService.edit(result.user, result.password);
            this.router.navigateByUrl('/dashboard/users');
          })
        } catch (err) {
          console.log(err);
          await this.router.navigateByUrl('/dashboard/users');
        }
        this.activeModal = null;
      }
    })
  }

  async ngOnInit() {
    this.userlist = await this.userService.getAll();
  }
}

import { Component, OnInit } from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../services/user.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";

@Component({
  selector: 'app-dashboard-router',
  templateUrl: './dashboard-router.component.html',
  styleUrls: ['./dashboard-router.component.scss']
})
export class DashboardRouterComponent implements OnInit {

  parameter;
  constructor(private modalService: NgbModal,
              private userService: UserService,
              private route: ActivatedRoute,
              private router: Router) {
    this.route.paramMap.subscribe(async (paramMap: ParamMap) => {
      this.parameter = paramMap.get('parameter');
    })
  }

  ngOnInit() {
  }

}

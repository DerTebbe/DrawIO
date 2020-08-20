import {Component, Input, OnInit} from '@angular/core';
import {User} from "../../../models/User";

@Component({
  selector: 'app-login-history-entry',
  templateUrl: './login-history-entry.component.html',
  styleUrls: ['./login-history-entry.component.scss']
})
export class LoginHistoryEntryComponent implements OnInit {

  @Input() entry: {date: Date, user: User};
  date = '';

  constructor() {}

  ngOnInit() {
    this.date = new Date(this.entry.date).toLocaleString();
  }

}

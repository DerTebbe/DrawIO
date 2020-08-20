import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DrawingComment} from '../models/DrawingComment';
import {LoginService} from '../services/login.service';
import {ImageService} from '../services/image.service';
import {AlertService} from '../services/alert.service';
import {Drawing} from "../models/Drawing";
import {Rights} from "../models/Rights";

@Component({
  selector: 'app-drawing-card',
  templateUrl: './drawing-card.component.html',
  styleUrls: ['./drawing-card.component.scss']
})
export class DrawingCardComponent implements OnInit {

  title: string;
  description: string;
  comments: DrawingComment[] = [];
  authorsString: string = "Gezeichnet von: ";
  isAuthor: boolean = false;
  isAdmin: boolean = false;

  imageDataB64: string = '../../assets/images/spin.gif';

  @Input() drawingID: string;
  @Output() refreshEvent: EventEmitter<void>;


  constructor(private loginService: LoginService, private imageService: ImageService, private alertService: AlertService) {
    this.refreshEvent = new EventEmitter<void>();
  }

  delete() {
    this.imageService.deleteImage(this.drawingID).then(() => {
      this.refreshEvent.emit();
    })
      .catch(() => console.log("ERROR"))
  }

  ngOnInit() {
    this.imageService.getImage(this.drawingID).then((drawing: Drawing) => {
      this.loginService.getLogin().then(user => {
        for (let author of drawing.authors) {
          if (author.id === user.id) {
            this.isAuthor = true;
          }
        }
        console.log('Das result ist: ' + drawing.authors.includes(user));
        this.isAdmin = this.loginService.hasRights(Rights.Admin);
      });
      this.title = drawing.title;
      this.description = drawing.description;
      this.comments = [];
      if (drawing.comments) {
        for (let i = 0; i < 2; i++) {
          if (drawing.comments[i]) {
            this.comments.push(drawing.comments[i]);
          }
        }
      }
      this.imageDataB64 = drawing.imageData_b64;
      drawing.authors.forEach((item, index) => {
        this.authorsString += item.username;
        if(index != drawing.authors.length -1){
          this.authorsString += ", ";
        }
      });
    }).catch(reason => this.alertService.addAlert({type: 'danger', message: reason.message}));
  }

  comment() {
    this.alertService.addAlert({type: 'warning', message: 'Not implemented yet'})
  }

  edit() {
    this.alertService.addAlert({type: 'warning', message: 'Not implemented yet'})
  }
}

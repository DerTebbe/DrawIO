import { Component, OnInit } from '@angular/core';
import {ImageService} from '../services/image.service';
import {AlertService} from '../services/alert.service';
import {LoginService} from "../services/login.service";

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {

  drawingIDs: string[];
  private numLoaded = 0;

  constructor(private imageService: ImageService, private alertService: AlertService) { }

  ngOnInit() {
    this.imageService.getImageIDs(20).then(imIDs => {
      this.numLoaded = 0;
      this.drawingIDs = imIDs;
      this.numLoaded = imIDs.length;
    }).catch(reason => this.alertService.addAlert({type: 'danger', message: reason.message}));
  }

  onLoadMore() {
    console.log('LoadMore!');
    this.imageService.getImageIDs(20, this.numLoaded).then(imIDs => {
      this.drawingIDs = this.drawingIDs.concat(imIDs);
      this.numLoaded += imIDs.length;
      console.log('Full list: ' + this.drawingIDs);
    }).catch(reason => this.alertService.addAlert({type: 'danger', message: reason.message}));
  }

}

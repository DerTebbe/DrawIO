import {Component} from '@angular/core';
import {ImageService} from "../services/image.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {User} from "../models/User";

@Component({
  selector: 'app-image-save-modal',
  templateUrl: './image-save-modal.component.html',
  styleUrls: ['./image-save-modal.component.scss']
})
export class ImageSaveModalComponent {

  image_b64: string = '';
  authors: User[];
  title: string = '';
  description: string = '';
  dataError: boolean = false;
  checked: boolean = false;

  constructor(private imageService: ImageService, public activeModal: NgbActiveModal) {}

  save() {
    this.checkErrors();
    if (this.checked) {
      this.imageService.createImage(this.title, this.description, this.authors, new Date(), this.image_b64);
      this.activeModal.close();
    }
  }

  checkErrors() {
    if (this.title === '' || this.description === '') {
      this.dataError = true;
      setTimeout(() => {
        this.dataError = false;
      }, 5000)
    }else {
      this.checked = true;
    }
  }
}

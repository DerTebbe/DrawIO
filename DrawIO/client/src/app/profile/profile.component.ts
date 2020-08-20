import {Component} from '@angular/core';
import {UserService} from "../services/user.service";
import {LoginService} from "../services/login.service";
import {User} from "../models/User";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DeleteModalComponent} from "../delete-modal/delete-modal.component";
import {ImageService} from "../services/image.service";
import {Drawing} from "../models/Drawing";
import {AlertService} from "../services/alert.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

export class ProfileComponent {

  uploads: number = 0;
  user: User;
  password: string;
  usernameCard: string;
  galleryIsOpen: boolean = true;
  images: Drawing[] = [];
  changed = false;

  constructor(private userservice: UserService,
              public loginservice: LoginService,
              private alertService: AlertService,
              private modalService: NgbModal,
              private imageService: ImageService) {
    this.loginservice.getLogin().then((user: User) => {
      return this.user = new User(
        user.id,
        user.username,
        user.firstName,
        user.lastName,
        user.creationDate,
        user.rights
      );
      })
      .then((user: User) => {
        return this.imageService.getOnlyLoggedInUsersImages(user.id)
      })
      .then((value: string[]) => {
        this.uploads = value.length;
        let counter: number = 0;
        for (let imageID of value) {
          if (counter === 6) {
            break;
          }else {
            counter++;
            this.imageService.getImage(imageID).then((image: Drawing) => {
              this.images.push(image);
            })
          }
        }
      })
  }

  openProfileSettings() {
    this.galleryIsOpen = false;
  }

  openPersonalGallery() {
    this.galleryIsOpen = true;
    if (this.changed) {
      this.alertService.addAlert({message: "Du hast ungesicherte Änderungen!", type: "warning"})
    }
  }

  editUser() {
    this.userservice.edit(this.user, this.password)
      .then(() => {
        this.changed = false;
        return this.loginservice.getLogin();
      }).then((user) => {
        this.user = new User(
          user.id,
          user.username,
          user.firstName,
          user.lastName,
          user.creationDate,
          user.rights
        );
        this.usernameCard = user.username;
        this.password = '';
      }).catch((err) => {
      console.log(err)
    })
  }

  openDeleteUserModal(): void {
    const modalReference = this.modalService.open(DeleteModalComponent);
    modalReference.result.then(() => {
      this.loginservice.delete(this.user.id, true);
    }).catch(() => {});
  }

  change() {
    this.changed = true;
  }
}

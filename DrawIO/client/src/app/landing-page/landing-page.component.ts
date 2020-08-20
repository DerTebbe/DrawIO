import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {every} from "rxjs/operators";
import {ImageService} from "../services/image.service";
import {User} from "../models/User";
import {UserService} from "../services/user.service";

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {

  imageFolder: string = '../../assets/images/';
  iconFolder: string = '../../assets/icons/';

  promotionImageNr1Path: string = this.imageFolder + 'promotion1.jpg';
  promotionImageNr2Path: string = this.imageFolder + 'promotion2.jpg';
  getStartedIcon: string = this.iconFolder + 'hand.svg';
  test;

  public aboutBoxes: any = [
    {icon: this.iconFolder + 'tools.svg', title: 'Alles, was du zum Zeichnen brauchst!', desc: 'Du hast die Idee - wir haben die Tools! ' +
        'Lass deiner Kreativität freien Lauf und schaffe dein eigenes Kunstwerk!'},
    {icon: this.iconFolder + 'team.svg', title: 'Male zusammen mit Freunden!', desc: 'Werde zusammen mit deinen Freunden kreativ. ' +
        'Erstellt einen Raum, und schon steht eurem gemeinsamen Kunstwerk nichts mehr im Weg!'},
    {icon: this.iconFolder + 'gallery.svg', title: 'Entdecke Neues!', desc: 'Lass deinen Blick durch die vielfältige Auswahl an Bildern in unserer Galerie schweifen und ' +
        'finde Inspiration für dein neues Kunstwerk!'},
    {icon: this.iconFolder + 'share.svg', title: 'Teile deine Werke!', desc: 'Werde jetzt Teil unserer Community, teile deine Bilder in der Galerie und präsentiere sie ' +
        'einem Millionenpublikum!'}
  ];
  constructor(public router: Router) {}
}

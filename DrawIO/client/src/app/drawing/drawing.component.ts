import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Params, Router, UrlSegment} from '@angular/router';
import {Subscription} from 'rxjs';
import {LoginService} from '../services/login.service';
import {SocketService} from '../services/socket.service';
import {Rights} from "../models/Rights";
import {ImageService} from "../services/image.service";
import {AlertService} from "../services/alert.service";

@Component({
  selector: 'app-drawing',
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss']
})
export class DrawingComponent implements OnInit, OnDestroy {
  toJoinRoomID: number;
  urlSegments: UrlSegment[];
  params: Params;
  info: boolean;
  offline: boolean;
  online: boolean;
  roomID = 0;
  Rights = Rights;
  image: Blob;
  title: string;
  description: string;
  private urlSegmentsSubscription: Subscription;
  private paramsSubscription: Subscription;
  @ViewChild('invalidRoomRef', {static: false})
  invalidRoomParagraph: ElementRef<HTMLParagraphElement>;

  constructor(private socketService: SocketService,
              public loginService: LoginService,
              private route: ActivatedRoute,
              public router: Router,
              private imageService: ImageService,
              private alertService: AlertService) {
    this.socketService.socket.on('createRoom', (roomID: number) => {
      this.router.navigateByUrl(`/draw/room/${roomID}`);
    });
    this.socketService.socket.on('validRoom', (roomID: number) => {
      this.router.navigateByUrl(`/draw/room/${roomID}`);
    });
    this.socketService.socket.on('invalidRoom', (roomID: number) => {
      if (this.invalidRoomParagraph) {
        this.invalidRoomParagraph.nativeElement.innerHTML = `ungültige Raum-ID: ${roomID}`;
        setTimeout(() => this.invalidRoomParagraph.nativeElement.innerHTML = '', 5000);
      }
    });
  }

  ngOnInit() {
    this.urlSegmentsSubscription = this.route.url.subscribe((urlSegments: UrlSegment[]) => {
      this.urlSegments = urlSegments;
    });
    this.paramsSubscription = this.route.params.subscribe((params: Params) => {
      this.params = params;
    });
    this.info = this.urlSegments.length === 1 && this.urlSegments[0].path === 'draw';
    this.offline = this.urlSegments.length === 2 && this.urlSegments[0].path === 'draw' && this.urlSegments[1].path === 'offline';
    if (this.urlSegments.length === 3 && this.urlSegments[0].path === 'draw' && this.urlSegments[1].path === 'room') {
      this.roomID = Number.parseInt(this.urlSegments[2].path, 10);
      this.online = true;
    }
  }
  sendCreateRoom(): void {
    this.socketService.socket.emit('createRoom', this.loginService.loggedInUser);
  }
  sendJoinRoom(): void {
    this.socketService.socket.emit('getValidRoom', this.toJoinRoomID);
  }
  drawOffline(): void {
    this.router.navigateByUrl(`/draw/offline`);
  }
  ngOnDestroy(): void {
    this.urlSegmentsSubscription.unsubscribe();
    this.paramsSubscription.unsubscribe();
  }
  imageInput(event) {
    this.image = event.target.files[0];
    console.log(event.target.files[0])
  }
  upload() {
    if (!this.image || !this.title || !this.description) {
      return
    }
    let reader = new FileReader();
    reader.readAsDataURL(this.image);
    reader.onload = async () => {
      //me.modelvalue = reader.result;
      this.imageService.createImage(this.title, this.description, [await this.loginService.loggedInUser], new Date(), reader.result as string)
        .then((res) => {
          this.alertService.addAlert({message: "Bild erfolgreich hinzugefügt", type: "success"});
          this.image = undefined;
          this.title = undefined;
          this.description = undefined;
        })
        .catch((err) =>this.alertService.addAlert({message: err, type: "danger"}));
    };
    reader.onerror = (error) => {
      console.log('Error: ', error);
    };
  }
}

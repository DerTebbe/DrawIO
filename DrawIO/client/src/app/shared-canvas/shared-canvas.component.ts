import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SocketService} from '../services/socket.service';
import {Coordinate} from '../Coordinate';
import {Path} from '../Path';
import {CanvasLayer} from '../CanvasLayer';
import {Layer} from '../Layer';
import {LoginService} from '../services/login.service';
import {UserService} from '../services/user.service';
import {User} from '../models/User';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ImageSaveModalComponent} from '../image-save-modal/image-save-modal.component';
import {Router, NavigationStart} from '@angular/router';
import {AlertService} from '../services/alert.service';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';

enum CanvasSize {
  SMALL,
  MEDIUM,
  LARGE
}

enum DrawType {
  DOT,
  LINE
}

/* TODOS TO DO
  TODO: implement draw modes: square + circle (requires datastructure Path to be a subset of a greater structure e.g. DrawingOperation --> takes time to change)
 */

@Component({
  selector: 'app-shared-canvas',
  templateUrl: './shared-canvas.component.html',
  styleUrls: ['./shared-canvas.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SharedCanvasComponent implements OnInit, OnDestroy {
  @Input() online: boolean;
  @Input() roomID: number;
  DrawType = DrawType;
  @ViewChild('layerListRef', {static: true})
  layerList: ElementRef<HTMLUListElement>;
  @ViewChild('containerRef', {static: true})
  container: ElementRef<HTMLDivElement>;
  @ViewChild('drawingCanvasRef', {static: true})
  canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('backgroundCanvasRef', {static: true})
  backgroundCanvas: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D;
  canvasSize: CanvasSize = CanvasSize.LARGE;
  previousCoordinates: {x: number, y: number} = { x: 0, y: 0 };
  layerCount = 0;

  lineWidth = 10;
  lineAlpha = 100; // use this.getLineAlpha() for a value between 0 to 1
  backgroundVisible = true;
  backgroundColor: string | CanvasGradient | CanvasPattern = '#FFFFFF';
  lineColor: string | CanvasGradient | CanvasPattern = '#000000';
  drawLock = false;
  mouseDown = false;
  coordinates: Coordinate[] = [];

  canvasLayers: CanvasLayer[] = [];
  selectedLayer: CanvasLayer = null;

  dragSrcEl: HTMLLIElement;
  clientID: string;
  navigationSubscription: Subscription;

  layerID = 0;


  constructor(public socketService: SocketService,
              public loginService: LoginService,
              private userService: UserService,
              private modal: NgbModal,
              private router: Router,
              private alertService: AlertService) {
    this.socketService.socket.on('socketID', (id: string) => { this.clientID = id; });
    this.socketService.socket.on('drawLock', () => { this.drawLock = true; });
    this.socketService.socket.on('draw', (drawInfo: {layerID: number, path: Path}) => {
      this.drawPath(drawInfo.path, drawInfo.layerID);
    });
    this.socketService.socket.on('drawUnlock', () => { this.drawLock = false; });
    this.socketService.socket.on('drawBackground', (background: {visible: boolean, color: string | CanvasGradient | CanvasPattern}) => {
      this.backgroundVisible = background.visible;
      this.backgroundColor = background.color;
      this.drawBackground();
    });
    // this.socketService.socket.on('clearAll', () => {
    //   this.backgroundVisible = true;
    //   this.backgroundColor = '#FFFFFF';
    //   this.coordinates = [];
    //   this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    //   for (const canvasLayer of this.canvasLayers) {
    //     this.clearLayer(canvasLayer.layer.layerID);
    //   }
    // });
    this.socketService.socket.on('addLayer', (layer: Layer) => {
      this.addLayer(layer);
    });
    // TODO: callback argument
    this.socketService.socket.on('clearLayer', (layerID: number) => {
      this.clearLayer(layerID);
    });
    this.socketService.socket.on('removeLayer', (layerID: number) => {
      this.removeLayer(layerID);
    });
    this.socketService.socket.on('synchronize', (syncData: {layers: Layer[], backgroundSettings: {visible: boolean, color: string | CanvasGradient | CanvasPattern}}) => {
      this.ctx.fillStyle = this.backgroundColor;
      for (const canvasLayer of this.canvasLayers) {
        this.removeLayer(canvasLayer.layer.layerID);
      }
      this.canvasLayers = [];
      this.selectedLayer = null;
      for (const layer of syncData.layers) {
        this.addLayer(layer);
        for (const path of layer.paths) {
          this.drawPath(path, layer.layerID);
        }
      }
    });
    this.socketService.socket.on('updateLayerOrder', (layerIDs: number[]) => {
      const tmp: CanvasLayer[] = [];
      for (const layerID of layerIDs) {
        const canvasLayer: CanvasLayer = this.canvasLayers.find((cl: CanvasLayer) => cl.layer.layerID === layerID);
        if (canvasLayer) {
          tmp.push(canvasLayer);
        }
      }
      this.canvasLayers = tmp;
      this.sortLayerListItems(layerIDs);
      this.updateLayers();
    });
  }

  drawPointer(position: { x: number, y: number}): void {
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 5, 0, 2 * Math.PI);
    this.ctx.stroke();
  }
  clearCanvas(): void {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }
  calculatePosition(clientX: number, clientY: number): { x: number, y: number} {
    const bounds = this.canvas.nativeElement.getBoundingClientRect();
    // calculations for normal display
    // const x = this.canvas.nativeElement.width * (event.clientX - this.canvas.nativeElement.offsetLeft + window.pageXOffset) / bounds.width;
    // const y = this.canvas.nativeElement.height * (event.clientY - this.canvas.nativeElement.offsetTop + window.pageYOffset) / bounds.height;
    // calculations for absolute within relative display
    const x = this.canvas.nativeElement.width * (clientX - bounds.left) / bounds.width;
    const y = this.canvas.nativeElement.height * (clientY - bounds.top) / bounds.height;
    return {x: Math.floor(x) + 0.5, y: Math.floor(y)};
  }
  setCanvasSize(): void {
    let width: number;
    let height: number;
    switch (this.canvasSize) {
      case CanvasSize.LARGE:
        width = 800;
        height = 600;
        break;
      case CanvasSize.MEDIUM:
        width = 600;
        height = 400;
        break;
      default:
      case CanvasSize.SMALL:
        width = 400;
        height = 200;
    }
    this.canvas.nativeElement.width = width;
    this.canvas.nativeElement.height = height;
  }
  setMouse(clientX: number, clientY: number): void {
    const {x, y} = this.calculatePosition(clientX, clientY);
    this.previousCoordinates.x = x;
    this.previousCoordinates.y = y;
  }
  drawLocal(clientX: number, clientY: number): void {
    if (this.mouseDown && this.selectedLayer) {
      const {x, y} = this.calculatePosition(clientX, clientY);
      this.coordinates.push({x, y});
      while (this.coordinates.length < 3) {
        this.coordinates.push({x, y});
      }
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = this.lineColor;
      this.ctx.globalAlpha = this.getLineAlpha();
      const prev: Coordinate = this.coordinates[this.coordinates.length - 2];
      const prevprev: Coordinate = this.coordinates[this.coordinates.length - 3];
      this.ctx.beginPath();
      this.ctx.moveTo(prevprev.x, prevprev.y);
      this.ctx.quadraticCurveTo(prev.x, prev.y, x, y);
      this.ctx.globalAlpha = this.getLineAlpha();
      this.ctx.stroke();
    }
  }
  sendPath(): void {
    if (!this.mouseDown || !this.selectedLayer || this.coordinates.length <= 2) { return; }
    this.socketService.socket.emit('draw', {roomID: this.roomID, layerID: this.selectedLayer.layer.layerID, path: { coordinates: this.coordinates, width: this.lineWidth, color: this.lineColor, alpha: this.getLineAlpha()}});
    // this.ctx.closePath();
    this.coordinates = [];
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }
  drawPath(path: Path, layerID: number): void {
    if (path.coordinates.length < 3) { return; }
    const canvasLayer: CanvasLayer = this.canvasLayers.find((cl: CanvasLayer) => cl.layer.layerID === layerID);
    if (!canvasLayer) { return; }
    if (this.mouseDown) { this.ctx.closePath(); }
    const ctx = canvasLayer.canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = path.width;
    ctx.fillStyle = path.color;
    ctx.strokeStyle = path.color;
    ctx.globalAlpha = path.alpha;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.moveTo(path.coordinates[0].x, path.coordinates[0].y);
    for (let i = 1; i < path.coordinates.length - 2; i++) {
      const c = (path.coordinates[i].x + path.coordinates[i + 1].x) / 2;
      const d = (path.coordinates[i].y + path.coordinates[i + 1].y) / 2;
      ctx.quadraticCurveTo(path.coordinates[i].x, path.coordinates[i].y, c, d);
    }
    // For the last 2 points
    ctx.quadraticCurveTo(path.coordinates[path.coordinates.length - 2].x, path.coordinates[path.coordinates.length - 2].y, path.coordinates[path.coordinates.length - 1].x, path.coordinates[path.coordinates.length - 1].y);
    ctx.stroke();
    // this.ctx.closePath();
    if (this.mouseDown) { ctx.beginPath(); }
    const imgElem: HTMLImageElement = canvasLayer.listItem.getElementsByTagName('img').item(0);
    imgElem.src = canvasLayer.canvas.toDataURL('image/png');
  }
  getDistance(a: Coordinate, b: Coordinate): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
  drawBackground(): void {
    const style: CSSStyleDeclaration = this.backgroundCanvas.nativeElement.style;
    this.backgroundVisible ? style.backgroundColor = this.backgroundColor as string : style.backgroundColor = null;
  }
  sendBackground(): void {
    this.socketService.socket.emit('drawBackground', {roomID: this.roomID, background: {visible: this.backgroundVisible, color: this.backgroundColor}});
  }
  getLineAlpha(): number {
    return this.lineAlpha / 100;
  }
  // sendClearAll(): void {
  //   this.socketService.socket.emit('clearAll');
  // }
  sendClearLayer(): void {
    if (this.selectedLayer) {
      this.socketService.socket.emit('clearLayer', {roomID: this.roomID, layerID: this.selectedLayer.layer.layerID});
    }
  }
  sendRemoveLayer(): void {
    if (this.selectedLayer) {
      this.socketService.socket.emit('removeLayer', {roomID: this.roomID, layerID: this.selectedLayer.layer.layerID, user: this.loginService.loggedInUser});
    }
  }
  downloadImage(): void {
    const link: HTMLAnchorElement = document.createElement('a');
    this.reduceCanvasses().toBlob((blob: Blob) => {
      const blobUrl: string = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = 'Bild.png';
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    }, 'image/png', 1);
  }
  getFinalDrawingDataURL(): string {
    return this.reduceCanvasses().toDataURL('image/png', 1);
  }
  reduceCanvasses(): HTMLCanvasElement {
    const tmpCanvas: HTMLCanvasElement = document.createElement('canvas');
    tmpCanvas.width = this.canvas.nativeElement.width;
    tmpCanvas.height = this.canvas.nativeElement.height;
    const tmpctx: CanvasRenderingContext2D = tmpCanvas.getContext('2d') as CanvasRenderingContext2D;
    if (this.backgroundVisible) {
      tmpctx.fillStyle = this.backgroundColor;
      tmpctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
    }
    for (const canvas of this.canvasLayers.map((cl: CanvasLayer) => cl.canvas)) {
      tmpctx.drawImage(canvas, 0, 0);
    }
    return tmpCanvas;
  }
  sendAddLayer(): void {
    this.socketService.socket.emit('addLayer', {roomID: this.roomID, user: this.loginService.loggedInUser});
  }
  sendLayerOrder(): void {
    this.socketService.socket.emit('updateLayerOrder', {roomID: this.roomID, layerIDs: this.canvasLayers.map((cl: CanvasLayer) => cl.layer.layerID)});
  }
  addLayer(layer: Layer): void {
    const elem: HTMLCanvasElement = document.createElement('canvas');
    const style: CSSStyleDeclaration = elem.style;
    elem.width = 800;
    elem.height = 600;
    style.zIndex = `${this.layerCount++}`;
    style.pointerEvents = 'none';
    this.canvas.nativeElement.style.zIndex = `${this.layerCount}`;
    this.container.nativeElement.append(elem);
    const layerOwner: boolean = !this.online || layer.userID === this.loginService.loggedInUser.id;
    const listItem: HTMLLIElement = this.addLayerListItem(layer, layerOwner);
    const canvasLayer = {canvas: elem, listItem, layer};
    this.canvasLayers.push(canvasLayer);
    if (layerOwner) {
      const items: HTMLCollectionOf<HTMLLIElement> = this.layerList.nativeElement.getElementsByTagName('li');
      for (let i = 0; i < items.length; i++) {
        const item = items.item(i);
        item.classList.remove('active');
      }
      canvasLayer.listItem.classList.add('active');
      this.selectedLayer = canvasLayer;
    } else {
      listItem.classList.add('locked');
    }
  }
  removeLayer(layerID: number): void {
    const canvasLayer: CanvasLayer = this.canvasLayers.find((cl: CanvasLayer) => cl.layer.layerID === layerID);
    if (canvasLayer) {
      const canvas: HTMLCanvasElement = canvasLayer.canvas;
      const listItem: HTMLLIElement = canvasLayer.listItem;
      if (canvas) {
        this.container.nativeElement.removeChild(canvas);
        this.canvas.nativeElement.style.zIndex = `${--this.layerCount}`;
      }
      if (listItem) {
        this.layerList.nativeElement.removeChild(listItem);
      }
      this.canvasLayers.splice(this.canvasLayers.indexOf(canvasLayer), 1);
      // unselects the currently removed layer if this user removed it
      this.selectedLayer = this.selectedLayer === canvasLayer ? null : this.selectedLayer;
    }
  }
  addLayerListItem(layer: Layer, layerOwner: boolean): HTMLLIElement {
    const li: HTMLLIElement = document.createElement('li');
    const p: HTMLParagraphElement = document.createElement('p');
    p.innerText = `${layerOwner ? '' : '[LOCKED] '}Layer ${layer.layerID}`;
    p.setAttribute('draggable', 'false');
    this.addDnDHandlers(li);
    li.addEventListener('click', () => {
      const canvasLayer: CanvasLayer = this.canvasLayers.find((cl: CanvasLayer) => cl.layer.layerID === layer.layerID);
      if (layerOwner) {
        const items: HTMLCollectionOf<HTMLLIElement> = this.layerList.nativeElement.getElementsByTagName('li');
        for (let i = 0; i < items.length; i++) {
          const item = items.item(i);
          item.classList.remove('active');
        }
        li.classList.add('active');
        this.selectedLayer = canvasLayer;
      }
    });
    const previewImage: HTMLImageElement = document.createElement('img');
    previewImage.width = this.canvas.nativeElement.width;
    previewImage.height = this.canvas.nativeElement.height;
    previewImage.setAttribute('draggable', 'false');
    const toggle: HTMLInputElement = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.defaultChecked = true;
    toggle.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      const canvasLayer: CanvasLayer = this.canvasLayers.find((cl: CanvasLayer) => cl.layer.layerID === layer.layerID);
      if (canvasLayer) {
        canvasLayer.canvas.style.visibility = toggle.checked ? 'visible' : 'hidden';
      }
    });
    li.append(toggle);
    li.append(previewImage);
    li.append(p);
    this.layerList.nativeElement.prepend(li);
    return li;
  }
  addDnDHandlers(li: HTMLLIElement): void {
    li.setAttribute('draggable', 'true');
    li.classList.add('list-group-item');
    li.addEventListener('dragstart', (e: DragEvent) => {
      this.dragSrcEl = e.target as HTMLLIElement;
    });
    li.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
    }, false);
    li.addEventListener('dragenter', () => {
      // TODO: maybe add styling?
    }, false);
    li.addEventListener('dragleave', (e: DragEvent) => {
      // TODO: maybe add styling?
    }, false);
    li.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      let target: HTMLElement = e.target as HTMLElement;
      while (!(target instanceof HTMLLIElement)) {
        target = target.parentElement;
      }
      const idxSrc = this.getLayerIndex(this.dragSrcEl);
      const idxTarget = this.getLayerIndex(target);
      if (idxSrc < idxTarget) {
        // drag towards bottom
        target.before(this.dragSrcEl);
        this.dragSrcEl.before(target);
      } else {
        // drag towards top
        target.after(this.dragSrcEl);
        this.dragSrcEl.after(target);
      }
      this.updateLayers();
      this.sendLayerOrder();
    });
  }
  sortLayerListItems(layerIDs: number[]): void {
    for (const layerID of layerIDs) {
      const canvasLayer: CanvasLayer = this.canvasLayers.find((cl: CanvasLayer) => cl.layer.layerID === layerID);
      if (canvasLayer) {
        this.layerList.nativeElement.removeChild(canvasLayer.listItem);
        this.layerList.nativeElement.prepend(canvasLayer.listItem);
      }
    }
  }
  getLayerIndex(elem: HTMLLIElement): number {
    const items: HTMLCollectionOf<HTMLLIElement> = this.layerList.nativeElement.getElementsByTagName('li');
    for (let idx = 0; idx < items.length; idx++) {
      if (items.item(idx) === elem) {
        return idx;
      }
    }
    return -1;
  }
  updateLayers(): void {
    for (const canvasLayer of this.canvasLayers) {
      const listItem: HTMLLIElement = canvasLayer.listItem;
      const idx = this.getLayerIndex(listItem);
      canvasLayer.canvas.style.zIndex = `${this.layerList.nativeElement.getElementsByTagName('li').length - 1 - idx}`;
    }
    this.sortLayers();
  }
  sortLayers(): void {
    this.canvasLayers = this.canvasLayers.sort((a, b) => {
      if (a.canvas.style.zIndex < b.canvas.style.zIndex) { return -1; }
      if (a.canvas.style.zIndex > b.canvas.style.zIndex) { return 1; }
      return 0;
    });
  }
  clearLayer(layerID: number): void {
    const canvasLayer: CanvasLayer = this.canvasLayers.find((cl: CanvasLayer) => cl.layer.layerID === layerID);
    const ctx = canvasLayer.canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasLayer.canvas.width, canvasLayer.canvas.height);
    canvasLayer.layer.paths = [];
    const imgElem: HTMLImageElement = canvasLayer.listItem.getElementsByTagName('img').item(0);
    imgElem.src = canvasLayer.canvas.toDataURL('image/png');
  }
  handleMouseDown(clientX: number, clientY: number): void {
    this.mouseDown = true;
    this.drawLocal(clientX, clientY);
  }
  handleMouseMove(clientX: number, clientY: number): void {
    this.drawLocal(clientX, clientY);
    this.setMouse(clientX, clientY);
  }
  handleMouseUp(): void {
    if (this.online) {
      this.sendPath();
    } else {
      this.drawPath({ coordinates: this.coordinates, width: this.lineWidth, color: this.lineColor, alpha: this.getLineAlpha()}, this.selectedLayer.layer.layerID);
      this.coordinates = [];
      this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }
    this.mouseDown = false;
  }
  handleMouseLeave(): void {
    this.handleMouseUp();
  }
  handleBackgroundVisibleInput(): void {
    this.drawBackground();
    if (this.online) {
      this.sendBackground();
    }
  }
  handleBackgroundColorInput(): void {
    this.handleBackgroundVisibleInput();
  }
  handleClearLayer(): void {
    if (this.online) {
      this.sendClearLayer();
    } else {
      this.clearLayer(this.selectedLayer.layer.layerID);
    }
  }
  handleRemoveLayer(): void {
    if (this.online) {
      this.sendRemoveLayer();
    } else {
      this.removeLayer(this.selectedLayer.layer.layerID);
    }
  }
  handleAddLayer(): void {
    if (this.online) {
      this.sendAddLayer();
    } else {
      const layer: Layer = {layerID: this.layerID++, paths: [], userID: null};
      this.addLayer(layer);
    }
  }

  ngOnInit() {
    this.navigationSubscription = this.router.events.pipe(filter(event => event instanceof NavigationStart)).subscribe((event: NavigationStart) => {
      this.socketService.socket.emit('leaveRoom', {user: this.loginService.loggedInUser, roomID: this.roomID});
    });
    this.setCanvasSize();
    this.ctx = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.backgroundCanvas.nativeElement.style.zIndex = '-1';
    this.canvas.nativeElement.style.zIndex = '0';
    this.drawBackground();
    this.canvas.nativeElement.oncontextmenu = () => false;
    // event handlers for mobile
    this.canvas.nativeElement.addEventListener('touchstart', (event: TouchEvent) => this.handleMouseDown(event.touches[0].clientX, event.touches[0].clientY));
    this.canvas.nativeElement.addEventListener('touchmove', (event: TouchEvent) => this.handleMouseMove(event.touches[0].clientX, event.touches[0].clientY));
    this.canvas.nativeElement.addEventListener('touchend', (event: TouchEvent) => this.handleMouseUp());
    setTimeout(() => {
      this.socketService.socket.emit('joinRoom', {user: this.loginService.loggedInUser, roomID: this.roomID});
    }, 0);
  }

  async openModal() {
    let users: User[];
    if (this.online) {
      users = await this.userService.getRoomUsers(this.roomID);
    } else {
      users = [this.loginService.loggedInUser];
    }
    const modalReference = this.modal.open(ImageSaveModalComponent);
    modalReference.componentInstance.authors = users;
    modalReference.componentInstance.image_b64 = this.getFinalDrawingDataURL();
    modalReference.result.then(() => {
      this.router.navigate(['/']);
      this.alertService.addAlert({type: 'success', message: 'Bild erfolgreich gespeichert!'});
    }).catch(() => {
      console.log('Unregulär geschlossen');
    });
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

}

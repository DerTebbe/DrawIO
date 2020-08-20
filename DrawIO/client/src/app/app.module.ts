import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app-component/app.component';
import {NavbarComponent} from './navbar/navbar.component';
import {AngularFontAwesomeModule} from 'angular-font-awesome';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import {NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {SharedCanvasComponent} from './shared-canvas/shared-canvas.component';
import { LoginModalComponent } from './login-modal/login-modal.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardNavbarComponent } from './dashboard/dashboard-navbar/dashboard-navbar.component';
import { UserlistComponent } from './dashboard/userlist/userlist.component';
import { UserComponent } from './dashboard/user/user.component';
import { DashboardEditUserComponent } from './dashboard/dashboard-edit-user/dashboard-edit-user.component';
import {ProfileComponent } from './profile/profile.component';
import { DrawingCardComponent } from './drawing-card/drawing-card.component';
import { GalleryComponent } from './gallery/gallery.component';
import { AlertsComponent } from './alerts/alerts.component';
import { DeleteModalComponent } from './delete-modal/delete-modal.component';
import { RegisterModalComponent } from './register-modal/register-modal.component';
import { DrawingComponent } from './drawing/drawing.component';
import { DashboardRouterComponent } from './dashboard/dashboard-router/dashboard-router.component';
import { LoginHistoryComponent } from './dashboard/login-history/login-history.component';
import { LoginHistoryEntryComponent } from './dashboard/login-history/login-history-entry/login-history-entry.component';
import {environment} from '../environments/environment';
import { ImageSaveModalComponent } from './image-save-modal/image-save-modal.component';
import { ChatComponent } from './chat/chat.component';
import { StatisticsComponent } from './dashboard/statistics/statistics.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { DatenschutzComponent } from './datenschutz/datenschutz.component';

const socketConfig: SocketIoConfig = { url: `${environment.apiUrl}/`, options: { autoConnect: true } };

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    SharedCanvasComponent,
    LoginModalComponent,
    LandingPageComponent,
    DashboardComponent,
    DashboardNavbarComponent,
    UserlistComponent,
    ProfileComponent,
    DrawingCardComponent,
    GalleryComponent,
    AlertsComponent,
    UserComponent,
    DashboardEditUserComponent,
    DeleteModalComponent,
    RegisterModalComponent,
    DrawingComponent,
    DashboardRouterComponent,
    LoginHistoryComponent,
    LoginHistoryEntryComponent,
    ImageSaveModalComponent,
    StatisticsComponent,
    ChatComponent,
    ImpressumComponent,
    DatenschutzComponent,
  ],
  imports: [
    SocketIoModule.forRoot(socketConfig),
    HttpClientModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    AngularFontAwesomeModule,
    NgbModule
  ],
  providers: [NgbActiveModal],
  bootstrap: [AppComponent],
  entryComponents: [
    // all components being used as a modal here
    LoginModalComponent,
    DashboardEditUserComponent,
    DeleteModalComponent,
    RegisterModalComponent,
    ImageSaveModalComponent
  ]
})
export class AppModule { }

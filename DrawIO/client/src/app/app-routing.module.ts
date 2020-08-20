import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {UserlistComponent} from "./dashboard/userlist/userlist.component";
import {LandingPageComponent} from "./landing-page/landing-page.component";
import {ProfileComponent} from "./profile/profile.component";
import {GalleryComponent} from "./gallery/gallery.component";
import {LoginHistoryComponent} from "./dashboard/login-history/login-history.component";
import {UserGuard} from "./guards/user.guard";
import {AdminGuard} from "./guards/admin.guard";
import {StatisticsComponent} from "./dashboard/statistics/statistics.component";
import {DrawingComponent} from "./drawing/drawing.component";
import {RoomGuard} from "./guards/room.guard";
import {ImpressumComponent} from "./impressum/impressum.component";
import {DatenschutzComponent} from "./datenschutz/datenschutz.component";

const routes: Routes = [
  { path: '', component: LandingPageComponent},
  { path: 'gallery', canActivate: [UserGuard], component: GalleryComponent},
  { path: 'profile', canActivate: [UserGuard], component: ProfileComponent},
  { path: 'draw/offline', component: DrawingComponent},
  { path: 'draw/room/:roomID', canActivate: [UserGuard, RoomGuard], component: DrawingComponent},
  { path: 'draw', component: DrawingComponent},
  { path: 'impressum', component: ImpressumComponent},
  { path: 'datenschutz', component: DatenschutzComponent},
  { path: 'dashboard', canActivate: [AdminGuard], component: DashboardComponent, children: [
      {path: '', component: LandingPageComponent},
      {path: 'users', component: UserlistComponent},
      {path: 'profile', component: ProfileComponent},
      {path: 'draw/offline', component: DrawingComponent},
      {path: 'draw/room/:roomID', canActivate: [RoomGuard], component: DrawingComponent},
      {path: 'draw', component: DrawingComponent},
      {path: 'users/edit/:id', component: UserlistComponent},
      {path: 'gallery', component: GalleryComponent},
      {path: 'profile', component: ProfileComponent},
      {path: 'logins', component: LoginHistoryComponent},
      {path: 'statistics', component: StatisticsComponent},
    ]
  },
  {path: '**', redirectTo: '/', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

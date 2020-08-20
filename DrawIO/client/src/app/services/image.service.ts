import {Injectable} from '@angular/core';
import {Drawing} from '../models/Drawing';
import {User} from '../models/User';
import {DrawingComment} from '../models/DrawingComment';
import {HttpClient} from '@angular/common/http';
import {AlertService} from './alert.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(private httpClient: HttpClient, private alertService: AlertService) {}

  getImageIDs(limit: number, start: number = 0): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/images/${start}/${limit}`).toPromise().then((value: any) => {
        console.log(value.idList);
        resolve(value.idList);
      }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
        reject();
      });
    });
  }

  getImage(imageID: string): Promise<Drawing> {
    return new Promise<Drawing>((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/image/${imageID}`).toPromise().then((value: any) => {
        resolve(value.image);
      }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
        reject();
      });
    });
  }

  createImage(title: string, description: string, authors: User[], timestamp: Date, imageDataB64: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient.post(`${environment.apiUrl}/image`, {
        title,
        description,
        authors,
        timestamp,
        imageDataB64
      }).toPromise().then((value: any) => {
        resolve(value.imageId);
      }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
        reject();
      });
    });
  }

  updateImage(comments: DrawingComment[], imageID: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.httpClient.put(`${environment.apiUrl}/image/${imageID}`, {
        comments
      }).toPromise().then(() => {
        resolve();
      }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
        reject();
      });
    });
  }

  deleteImage(imageID: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.httpClient.delete(`${environment.apiUrl}/image/${imageID}`).toPromise().then(() => {
        resolve();
      }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
        reject();
      });
    });
  }

  getOnlyLoggedInUsersImages(id: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this.httpClient.get(`${environment.apiUrl}/images/${id}`).toPromise().then((value: any) => {
        resolve(value.idList)
      }).catch((err) => {
        this.alertService.addAlert({type: 'danger', message: err.message});
        reject();
      })
    })
  }
}

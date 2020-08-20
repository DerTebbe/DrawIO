import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSaveModalComponent } from './image-save-modal.component';

describe('ImageSaveModalComponent', () => {
  let component: ImageSaveModalComponent;
  let fixture: ComponentFixture<ImageSaveModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageSaveModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageSaveModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedCanvasComponent } from './shared-canvas.component';

describe('SharedCanvasComponent', () => {
  let component: SharedCanvasComponent;
  let fixture: ComponentFixture<SharedCanvasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SharedCanvasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SharedCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

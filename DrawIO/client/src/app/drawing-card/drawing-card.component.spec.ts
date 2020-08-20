import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingCardComponent } from './drawing-card.component';

describe('DrawingCardComponent', () => {
  let component: DrawingCardComponent;
  let fixture: ComponentFixture<DrawingCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DrawingCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

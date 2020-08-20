import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardEditUserComponent } from './dashboard-edit-user.component';

describe('DashboardEditUserComponent', () => {
  let component: DashboardEditUserComponent;
  let fixture: ComponentFixture<DashboardEditUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardEditUserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardEditUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

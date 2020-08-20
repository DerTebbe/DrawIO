import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginHistoryEntryComponent } from './login-history-entry.component';

describe('LoginHistoryEntryComponent', () => {
  let component: LoginHistoryEntryComponent;
  let fixture: ComponentFixture<LoginHistoryEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginHistoryEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginHistoryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminUserlistComponent } from './admin-userlist.component';
import { appService } from '../state/app.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AdminUserlistComponent', () => {
  let component: AdminUserlistComponent;
  let fixture: ComponentFixture<AdminUserlistComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [AdminUserlistComponent],
      providers: [
        provideMockStore({}),
        appService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(AdminUserlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

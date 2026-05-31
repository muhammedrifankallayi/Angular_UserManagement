import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserlistComponent } from './admin-userlist.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { appService } from '../state/app.service';

describe('AdminUserlistComponent', () => {
  let component: AdminUserlistComponent;
  let fixture: ComponentFixture<AdminUserlistComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [AdminUserlistComponent, AdminNavComponent],
      providers: [provideMockStore({}), appService]
    });
    fixture = TestBed.createComponent(AdminUserlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

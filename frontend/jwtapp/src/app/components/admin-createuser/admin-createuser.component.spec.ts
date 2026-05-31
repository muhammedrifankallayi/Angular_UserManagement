import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCreateuserComponent } from './admin-createuser.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

describe('AdminCreateuserComponent', () => {
  let component: AdminCreateuserComponent;
  let fixture: ComponentFixture<AdminCreateuserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
      declarations: [AdminCreateuserComponent, AdminNavComponent]
    });
    fixture = TestBed.createComponent(AdminCreateuserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

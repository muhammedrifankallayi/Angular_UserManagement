import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUsereditComponent } from './admin-useredit.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

describe('AdminUsereditComponent', () => {
  let component: AdminUsereditComponent;
  let fixture: ComponentFixture<AdminUsereditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
      declarations: [AdminUsereditComponent, AdminNavComponent]
    });
    fixture = TestBed.createComponent(AdminUsereditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

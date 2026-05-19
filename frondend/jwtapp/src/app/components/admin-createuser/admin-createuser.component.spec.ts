import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateuserComponent } from './admin-createuser.component';

describe('AdminCreateuserComponent', () => {
  let component: AdminCreateuserComponent;
  let fixture: ComponentFixture<AdminCreateuserComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule],
      declarations: [AdminCreateuserComponent]
    });
    fixture = TestBed.createComponent(AdminCreateuserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

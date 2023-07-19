import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { adminRoutingModule } from './components/admin-login/admin.routing';
import { AppComponent } from './app.component';
import { NavComponent } from './components/nav/nav.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminNavComponent } from './components/admin-nav/admin-nav.component';
import { ProfileComponent } from './components/profile/profile.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects'
import { appEffects } from './components/state/app.effects';
import { postReducer, profileReducer } from './components/state/app.reducer';
import { appService } from './components/state/app.service';
import { AdminUserlistComponent } from './components/admin-userlist/admin-userlist.component';
import { AdminUsereditComponent } from './components/admin-useredit/admin-useredit.component';
import { AdminCreateuserComponent } from './components/admin-createuser/admin-createuser.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavComponent,
    RegisterComponent,
    LoginComponent,
    AdminLoginComponent,
    DashboardComponent,
    AdminNavComponent,
    ProfileComponent,
    AdminUserlistComponent,
    AdminUsereditComponent,
    AdminCreateuserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    adminRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forRoot({userdetails:profileReducer,allusers:postReducer}),
    EffectsModule.forRoot([appEffects])
  ],
  providers: [appService],
  bootstrap: [AppComponent]
})
export class AppModule { }

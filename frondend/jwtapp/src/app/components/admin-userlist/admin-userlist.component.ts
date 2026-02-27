import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Emitters } from 'src/app/emitters/emitters';
import { retrievepost } from '../state/app.actions';
import { Router } from '@angular/router';
import { Users } from '../models/allUsers';
import { appService } from '../state/app.service';
import { uniqueEmail } from '../state/app.selectors';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-userlist',
  templateUrl: './admin-userlist.component.html',
  styleUrls: ['./admin-userlist.component.css']
})
export class AdminUserlistComponent implements OnInit, OnDestroy {
  constructor(
    private http:HttpClient,
    private store:Store<{allusers:Users[]}>,
    private router:Router,
    private appService:appService
  ){}

  userdata$ = this.store.pipe(select(uniqueEmail))
  filteredUserdata: Users[] = [];
  searchTerm: string = '';
  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.subscription.add(
      this.userdata$.subscribe((users) => {
        this.applyFilter(users);
      })
    );
    this.http.get('http://localhost:5000/api/admin/active',{
      withCredentials:true
    }).subscribe((res:any)=>{
      this.store.dispatch(retrievepost())
      Emitters.authEmitter.emit(true);
    },
    (err)=>{
      this.router.navigate(['/admin']);
      Emitters.authEmitter.emit(false);
    }
    )
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.userdata$.subscribe(users => this.applyFilter(users)).unsubscribe();
  }

  applyFilter(users: Users[]) {
    this.filteredUserdata = users.filter(user =>
      user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  deleteUser(userId: any){
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`, {}, {
      withCredentials:true
    }).subscribe((res:any)=>{
      this.store.dispatch(retrievepost())
      Swal.fire("Success","User Deleted Successfully","success");
      Emitters.authEmitter.emit(true)
    },
    (err)=>{
      this.router.navigate(['/admin']);
      Emitters.authEmitter.emit(false);
    }
    )
  }

  editUser(userId:any){
    this.router.navigate(['/admin/edit',userId])
  }
  
}

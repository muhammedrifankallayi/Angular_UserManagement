import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Emitters } from 'src/app/emitters/emitters';
import { retrievepost } from '../state/app.actions';
import { Router } from '@angular/router';
import { Users } from '../models/allUsers';
import { appService } from '../state/app.service';
import { uniqueEmail } from '../state/app.selectors';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-userlist',
  templateUrl: './admin-userlist.component.html',
  styleUrls: ['./admin-userlist.component.css']
})
export class AdminUserlistComponent implements OnInit {
  constructor(
    private http:HttpClient,
    private store:Store<{allusers:Users[]}>,
    private router:Router,
    private appService:appService
  ){}

  userdata$ = this.store.pipe(select(uniqueEmail))
    
  ngOnInit(): void {
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

  deleteUser(userId: any){
    this.http.post(`http://localhost:5000/api/admin/deleteUser/${userId}`,{
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

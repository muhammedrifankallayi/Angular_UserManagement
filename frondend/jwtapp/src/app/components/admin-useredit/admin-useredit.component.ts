import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Emitters } from 'src/app/emitters/emitters';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-useredit',
  templateUrl: './admin-useredit.component.html',
  styleUrls: ['./admin-useredit.component.css']
})
export class AdminUsereditComponent implements OnInit {

  username: any;
  email:any;
  form:FormGroup;
  
  constructor(
    private formBuilder: FormBuilder, 
    private http: HttpClient, 
    private router: ActivatedRoute,
    private route: Router
  ) { }

  public param:any;

  ngOnInit(): void {

    this.form = this.formBuilder.group({
      name: [this.username]
    })

    this.router.params.subscribe(params => {
      this.param = params['id'];
    });
     console.log(this.param);

     this.http.get('http://localhost:5000/api/admin/active',{
      withCredentials:true
     }).subscribe((res:any)=>{
      console.log(res);
      this.getusers(this.param);
      Emitters.authEmitter.emit(true);
      
     },(err)=>{
      this.route.navigate(['/admin']);
      Emitters.authEmitter.emit(false)
     })
     
  }

  
  validateEmail = (email: any) => {
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (email.match(validRegex)) {
      return true;
    } else {
      return false;
    }
  }

  submit():void {
    let user = this.form.getRawValue();
    console.log(user);
    user.email = this.email;
    if(user.name == null) {
      Swal.fire("Error","No changes made","error");
    }else if(user.name == ''){
      Swal.fire("Error","fields cannot be empty","error");
    }else{
      this.http.post('http://localhost:5000/api/admin/editUser',user,{
        withCredentials: true
      }).subscribe(()=>this.route.navigate(['/admin/userlist']),
      (err)=>{
        Swal.fire("Error",err.error.message,"error");
      })
    }
  }

  getusers(userId:any){
    this.http.post(`http://localhost:5000/api/admin/editDetails/${userId}`,{
      withCredentials: true
    }).subscribe((res:any)=>{
      console.log(res);
      this.username = res.name;
      this.email = res.email;
      Emitters.authEmitter.emit(true);
    },
    (err)=>{
      this.route.navigate(['/admin']);
      Emitters.authEmitter.emit(false);
    }
    )
  }

}

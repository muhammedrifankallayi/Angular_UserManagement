import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Emitters } from 'src/app/emitters/emitters';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  message = "you are not loged in"

  constructor(private http:HttpClient){}
  
  ngOnInit(): void {
    this.http.get('http://localhost:5000/api/user',{
      withCredentials:true
    })
    .subscribe((res:any)=>{
      this.message = `hi ${res.name}`
      Emitters.authEmitter.emit(true);
    },
    (err)=>{
      Emitters.authEmitter.emit(false);
    })
  }
}

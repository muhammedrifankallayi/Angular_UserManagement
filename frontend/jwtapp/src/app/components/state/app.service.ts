import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class appService{
    constructor(private http:HttpClient){}

    loadProfile(){
        return this.http.get("http://localhost:5000/api/profile",{
            withCredentials:true
        })
    }

    loadUsers(){
        return this.http.get("http://localhost:5000/api/admin/users",{
            withCredentials:true
        });
    }
}
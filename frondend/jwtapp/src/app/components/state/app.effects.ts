import { Injectable } from "@angular/core";
import { appService } from "./app.service";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { retrievepost, retrievepostSuccess, retrieveprofile, retrieveprofileSuccess } from "./app.actions";
import { map, switchMap } from "rxjs";
import { Profile, Users } from "../models/allUsers";

@Injectable()
export class appEffects{
    constructor(
        private actions$:Actions,
        private appService:appService
    ){}

    loadProfile$ = createEffect(()=>
    this.actions$.pipe(
        ofType(retrieveprofile),
        switchMap(()=>{
            return this.appService.loadProfile()
            .pipe(map((data)=>retrieveprofileSuccess({userdetails:data as Profile})))
        })
    )
    )

    loadAllUsers$ = createEffect(()=>
    this.actions$.pipe(
        ofType(retrievepost),
        switchMap(()=>{
            return this.appService.loadUsers()
            .pipe(map((data)=>retrievepostSuccess({allusers:data as Users[]})))
        })
    )
    )
}
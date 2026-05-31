import { Users } from '../models/allUsers'
import { Profile } from '../models/allUsers'

export interface appProfile{
    userdetails:Profile
}

export interface appUsers{
    allusers:Users[];
}
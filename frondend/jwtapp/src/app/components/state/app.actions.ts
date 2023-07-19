import { createAction,props } from '@ngrx/store';
import { Users } from '../models/allUsers';
import { Profile } from '../models/allUsers';

export const retrieveprofile = createAction('[profile API]API success');
export const retrieveprofileSuccess = createAction('[profile API]API SuccessSuccess',
props<{userdetails:Profile}>()
);

export const retrievepost = createAction('[post API]API success');
export const retrievepostSuccess = createAction('[post API]API SuccessSuccess',
props<{allusers: Users[]}>()
);


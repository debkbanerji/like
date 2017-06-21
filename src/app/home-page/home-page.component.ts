import {Component, OnInit} from '@angular/core';

import {AuthService} from '../providers/auth.service';
// import {AngularFireDatabase, FirebaseObjectObservable} from 'angularfire2/database';

@Component({
    selector: 'app-home-page',
    templateUrl: './home-page.component.html',
    styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

    // private displayNameObject: FirebaseObjectObservable<any>;
    public displayName: string;
    public LOGO_URL: string;

    // constructor(public authService: AuthService, private db: AngularFireDatabase) {
    constructor(public authService: AuthService) {
    }

    ngOnInit() {
        // TODO: Replace
        this.LOGO_URL = '/assets/images/logo.png';
        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth != null) {
                this.displayName = auth.displayName;
                // this.displayNameObject = this.db.object('/user-profiles/' + auth.uid + '/display-name');
            }
        });
    }

}

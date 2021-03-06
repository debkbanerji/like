import {Component, OnInit, OnDestroy} from '@angular/core';

import {Router} from '@angular/router';

import {AngularFireDatabase} from 'angularfire2/database';

import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit, OnDestroy {
    private userDataSubscription: Subscription;
    private likeSubscription: Subscription;
    public LOGO_URL: string;

    constructor(public authService: AuthService, private db: AngularFireDatabase, private router: Router) {
    }

    ngOnInit() {
        this.LOGO_URL = '/assets/images/logo.png';
    }

    loginWithGoogle() {
        this.authService.loginWithGoogle().then((loginData) => {
            this.authService.afAuth.auth.onAuthStateChanged((auth) => {
                if (auth != null) {
                    const likeObject = this.db.object('/likes/' + auth.uid);
                    this.likeSubscription = likeObject.subscribe((data) => {
                        if (!data.$value) {
                            likeObject.set(10);
                        }
                        const userObject = this.db.object('/user-profiles/' + auth.uid);
                        userObject.set({
                            'uid': auth.uid,
                            'email': auth.email,
                            'display-name': auth.displayName,
                            'photo-url': auth.photoURL
                        }).then(_ => {
                            this.router.navigate(['']);
                        });
                    });
                }
            });
        });
    }

    ngOnDestroy() {
        if (this.userDataSubscription) {
            this.userDataSubscription.unsubscribe();
        }
        if (this.likeSubscription) {
            this.likeSubscription.unsubscribe();
        }
    }
}

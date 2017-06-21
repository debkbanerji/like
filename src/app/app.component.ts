import {Component} from '@angular/core';

import {Router} from '@angular/router';

import {AuthService} from './providers/auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    constructor(public authService: AuthService, private router: Router) {
        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth == null) {
                // not logged in
                // redirect to login page
                this.router.navigate(['login']);
            } else {
                // logged in
                // navigate to default route
                // this.router.navigate(['']);
            }
        });
    }
}

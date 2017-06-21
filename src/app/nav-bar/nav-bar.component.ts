import {Component, OnInit, ApplicationRef, OnDestroy} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';

import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs/Subscription';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit, OnDestroy {
    private isLoggedIn: boolean;
    private routerSubscription: Subscription;
    private currentRoute: string;
    public navBarItems: Array<any>;

    constructor(public authService: AuthService, private apRef: ApplicationRef,
                private router: Router, private route: ActivatedRoute) {
    }

    ngOnInit() {
        // TODO: Replace
        this.navBarItems = [
            {
                route: '',
                text: 'Home'
            },
            {
                route: 'text-posts',
                text: 'Text Posts'
            },
            {
                route: 'friends',
                text: 'Friends'
            },
            {
                route: 'settings',
                text: 'Settings'
            },
            {
                route: 'logout', // Not actual route - caught by 'navigateTo' function
                text: 'Sign Out'
            }
        ];

        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            this.isLoggedIn = auth != null;
            this.apRef.tick(); // For updating UI
        });

        this.routerSubscription = this.route.url.subscribe(url => {
            if (url[0]) {
                this.currentRoute = url[0].path;
            } else {
                this.currentRoute = '';
            }
        });
    }

    private logout() {
        this.authService.logout();
    }

    private navigateTo(route) {
        if (route === 'logout') {
            this.authService.logout();
        } else {
            this.router.navigate([route]);
        }
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }
}

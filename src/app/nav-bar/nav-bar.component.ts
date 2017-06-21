import {Component, OnInit, ApplicationRef, OnDestroy} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';

import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs/Subscription';
import {AngularFireDatabase, FirebaseObjectObservable} from 'angularfire2/database';

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit, OnDestroy {
    private isLoggedIn: boolean;
    private routerSubscription: Subscription;
    private likesSubscription: Subscription;
    private currentRoute: string;
    public navBarItems: Array<any>;
    private likesObject: FirebaseObjectObservable<any>;

    constructor(public authService: AuthService, private apRef: ApplicationRef,
                private router: Router, private route: ActivatedRoute, private db: AngularFireDatabase) {
    }

    ngOnInit() {
        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth != null) {
                this.likesObject = this.db.object('/likes/' + auth.uid);
                this.likesSubscription = this.likesObject.subscribe((data) => {
                    this.navBarItems[this.navBarItems.length - 1] = {
                        text: 'Likes: ' + data.$value
                    };
                });
            }
        });
        this.navBarItems = [
            {
                route: '',
                text: 'Home'
            },
            {
                route: 'posts',
                text: 'Posts'
            },
            {
                route: 'friends',
                text: 'Friends'
            },
            {
                route: 'profile',
                text: 'Profile'
            },
            {
                route: 'logout', // Not actual route - caught by 'navigateTo' function
                text: 'Sign Out'
            },
            {
                text: 'Likes: 0'
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
        } else if (route && route !== '') {
            this.router.navigate([route]);
        }
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
        if (this.likesSubscription) {
            this.likesSubscription.unsubscribe();
        }
    }
}

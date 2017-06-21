import {Component, OnInit, OnDestroy} from '@angular/core';
import {NgForm} from '@angular/forms';

import {AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable} from 'angularfire2/database';

import {AuthService} from '../providers/auth.service';
import {Subscription} from 'rxjs/Subscription';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
    selector: 'app-text-posts',
    templateUrl: './text-posts.component.html',
    styleUrls: ['./text-posts.component.css']
})
export class TextPostsComponent implements OnInit, OnDestroy {
    // private numPostsSubscription: Subscription;
    // private numPostsObject: FirebaseObjectObservable<any>;
    // private numPosts: number;

    private PAGE_SIZE = 10;
    private limit: BehaviorSubject<number> = new BehaviorSubject<number>(this.PAGE_SIZE); // import 'rxjs/BehaviorSubject';
    public postsArray: FirebaseListObservable<any>;
    private postsArraySubscription: Subscription;
    private lastKey: String;
    public canLoadMoreData: boolean;
    private lastKeySubscription: Subscription;

    public submitText: String;
    private userDisplayName: String;
    private userUID: String;
    // private displayNameObject: FirebaseObjectObservable<any>;
    // private userDataSubscription: Subscription;

    formatDate(millis) {
        const date = new Date(millis);
        date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        return date.toLocaleString();
    }

    constructor(public authService: AuthService, private db: AngularFireDatabase) {
    }

    ngOnInit() {
        this.submitText = '';
        const feedLocation = '/text-posts';
        // this.numPostsObject = this.db.object(feedLocation + '/num-posts', {preserveSnapshot: true});
        // this.numPostsSubscription = this.numPostsObject.subscribe(snapshot => {
        //     let val = snapshot.val();
        //     if (!val) {
        //         val = 0;
        //     }
        //     this.numPosts = val;
        // });

        // asyncronously find the last item in the list
        this.lastKeySubscription = this.db.list(feedLocation + '/posts', {
            query: {
                orderByChild: 'datetime',
                limitToFirst: 1
            }
        }).subscribe((data) => {
            // Found the last key
            if (data.length > 0) {
                this.lastKey = data[0].$key;
            } else {
                this.lastKey = '';
            }
        });


        this.postsArray = this.db.list(feedLocation + '/posts', {
            query: {
                orderByChild: 'datetime',
                limitToLast: this.limit // Start at this.PAGE_SIZE newest items
            }
        });


        this.postsArraySubscription = this.postsArray.subscribe((data) => {
            this.updateCanLoadState(data);
        });


        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth == null) {
                // not logged in
                this.userDisplayName = '';
                this.userUID = '';
            } else {
                // logged in
                this.userDisplayName = auth.displayName;
                this.userUID = auth.uid;
                // if (auth != null) {
                //     this.displayNameObject = this.db.object('/user-profiles/' + auth.uid + '/display-name');
                //     this.userDataSubscription = this.displayNameObject.subscribe((data) => {
                //         this.userDisplayName = data.$value;
                //     });
                // }
            }
        });

        // // automatically try to load more data when scrolling down
        // window.onscroll = () => {
        //     if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        //         // Reached the bottom of the page
        //         this.tryToLoadMoreData();
        //     }
        // };

        // // Use this code to debug time zone differences
        // console.log((new Date()).getTimezoneOffset());
        // Date.prototype.getTimezoneOffset = function () {
        //     return -330;
        // };
    }

    private updateCanLoadState(data) {
        if (data.length > 0) {
            // If the first key in the list equals the last key in the database
            const oldestItemIndex = 0; // remember that the array is displayed in reverse
            this.canLoadMoreData = data[oldestItemIndex].$key !== this.lastKey;
        }
    }


    public tryToLoadMoreData(): void {
        if (this.canLoadMoreData) {
            this.limit.next(this.limit.getValue() + this.PAGE_SIZE);
        }
    }

    public onSubmit(form: NgForm) {
        if (form.valid) {
            let currDate: Date;
            currDate = new Date();
            currDate.setTime(currDate.getTime() + currDate.getTimezoneOffset() * 60 * 1000);
            this.postsArray.push(
                {
                    'title': form.value.title,
                    'text': form.value.text,
                    'poster-display-name': this.userDisplayName,
                    'poster-uid': this.userUID,
                    'datetime': currDate.getTime() // For internationalization purposes
                });
            form.resetForm();
            this.submitText = 'Successfully made post';
            // this.numPostsObject.set(this.numPosts + 1);
        } else {
            this.submitText = 'Please fill out all the required data';
        }
    }

    private removePost(key) {
        this.postsArray.remove(key);
        // this.numPostsObject.set(this.numPosts - 1);
    }

    ngOnDestroy() {
        // this.userDataSubscription.unsubscribe();
        // this.numPostsSubscription.unsubscribe();
        this.lastKeySubscription.unsubscribe();
        this.postsArraySubscription.unsubscribe();
        // window.onscroll = () => {
        //     // Clearing onscroll implementation (may not be necessary)
        // };
    }
}

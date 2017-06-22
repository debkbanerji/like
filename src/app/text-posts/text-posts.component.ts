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
    private feedLocation: string;
    private limit: BehaviorSubject<number> = new BehaviorSubject<number>(this.PAGE_SIZE); // import 'rxjs/BehaviorSubject';
    public postsArray: FirebaseListObservable<any>;
    private postsArraySubscription: Subscription;
    private lastKey: String;
    public canLoadMoreData: boolean;
    private lastKeySubscription: Subscription;
    private postSubscription: Subscription;
    public submitText: String;
    private userDisplayName: String;
    private userUID: String;
    public userLikesObject: FirebaseObjectObservable<any>;
    private userLikesSubscription: Subscription;
    private userLikes: number;
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
        this.feedLocation = '/text-posts';
        // this.numPostsObject = this.db.object(feedLocation + '/num-posts', {preserveSnapshot: true});
        // this.numPostsSubscription = this.numPostsObject.subscribe(snapshot => {
        //     let val = snapshot.val();
        //     if (!val) {
        //         val = 0;
        //     }
        //     this.numPosts = val;
        // });

        // asyncronously find the last item in the list
        this.lastKeySubscription = this.db.list(this.feedLocation + '/posts', {
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


        this.postsArray = this.db.list(this.feedLocation + '/posts', {
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
                this.userLikesObject = this.db.object('/likes/' + this.userUID);
                this.userLikesSubscription = this.userLikesObject.subscribe((data) => {
                    this.userLikes = data.$value;
                });
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
                    'datetime': currDate.getTime(), // For internationalization purposes
                    'likes': 0
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

    private likePost(key, posterUID) {
        // this.postsArray.remove(key);
        // const postObject = this.db.object(this.feedLocation + '/posts/' + key + '/likes');
        // this.postSubscription = postObject.subscribe((data) => {
        //     postObject.set(data.$value + 1);
        //     this.db.object('/likes/' + this.userUID).$ref.transaction(userData => {
        //         return userData - 1;
        //     });
        //     this.db.object('/likes/' + posterUID).$ref.transaction(otherData => {
        //         return otherData + 1;
        //     });
        // });
        if (this.userLikes > 0) {
            const otherPostObject = this.db.object(this.feedLocation + '/posts/' + key + '/likes');
            otherPostObject.$ref.transaction(postData => {
                return postData + 1;
            });
            this.db.object('/likes/' + posterUID).$ref.transaction(otherData => {
                return otherData + 1;
            });
            this.db.object('/likes/' + this.userUID).$ref.transaction(userData => {
                return userData - 1;
            });
        }
    }

    ngOnDestroy() {
        // this.userDataSubscription.unsubscribe();
        // this.numPostsSubscription.unsubscribe();
        if (this.lastKeySubscription) {
            this.lastKeySubscription.unsubscribe();
        }
        if (this.postsArraySubscription) {
            this.postsArraySubscription.unsubscribe();
        }
        if (this.postSubscription) {
            this.postSubscription.unsubscribe();
        }
        if (this.userLikesSubscription) {
            this.userLikesSubscription.unsubscribe();
        }
        // window.onscroll = () => {
        //     // Clearing onscroll implementation (may not be necessary)
        // };
    }
}

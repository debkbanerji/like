import {Component, OnInit, OnDestroy} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable} from 'angularfire2/database';
import {Subscription} from 'rxjs/Subscription';
import {AuthService} from '../providers/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {NgForm} from '@angular/forms';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
    private userUID: string;
    private friendUID: string;
    private userDisplayName: string;
    public friendDisplayName: string;
    public friendPhotoURL: string;
    private chatKey: string;
    private paramSubscription: Subscription;

    private uid1Subscription: Subscription;
    private uid2Subscription: Subscription;
    private friendSubscription: Subscription;

    public shouldDeleteOldMessages = true; // Set to true if you do not want to save space by not maintaining message history
    private totalMessages = 0; // NOTE: Only updated if shouldDeleteOldMessages is set to true
    private PAGE_SIZE = 20;
    private limit: BehaviorSubject<number> = new BehaviorSubject<number>(this.PAGE_SIZE); // import 'rxjs/BehaviorSubject';
    public messageListArray: FirebaseListObservable<any>;
    private messageListArraySubscription: Subscription;

    private lastKeySubscription: Subscription;
    private lastKey: string;
    private canLoadMoreData: boolean;

    constructor(public authService: AuthService, private db: AngularFireDatabase, private router: Router, private route: ActivatedRoute) {
    }

    formatDate(millis) {
        const date = new Date(millis);
        date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        return date.toLocaleString();
    }

    ngOnInit() {
        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth != null) {
                this.userUID = auth.uid;
                this.userDisplayName = auth.displayName;
                this.paramSubscription = this.route.params.subscribe(params => {
                    this.chatKey = params['chat-key'];

                    this.findFriendDisplayName();

                    // asyncronously find the last item in the list
                    this.lastKeySubscription = this.db.list('chats/' + this.chatKey + '/messages', {
                        query: {
                            orderByChild: 'post-time',
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

                    this.messageListArray = this.db.list('chats/' + this.chatKey + '/messages', {
                        query: {
                            orderByChild: 'post-time',
                            limitToLast: this.limit // Start at this.PAGE_SIZE newest items
                        }
                    });

                    if (this.shouldDeleteOldMessages) {
                        // Keep track of number of messages to know when to delete old ones
                        this.messageListArray.$ref.on('child_added', (child) => {
                            this.totalMessages += 1;
                        });
                        this.messageListArray.$ref.on('child_removed', (child) => {
                            this.totalMessages -= 1;
                        });
                    }

                    this.messageListArraySubscription = this.messageListArray.subscribe((data) => {
                        this.updateCanLoadState(data);
                    });

                });
            }
        });
    }

    private updateCanLoadState(data) {
        if (data.length > 0) {
            // If the first key in the list equals the last key in the database
            const oldestItemIndex = 0; // remember that the array is displayed in reverse
            this.canLoadMoreData = data[oldestItemIndex].$key !== this.lastKey;
        }
    }

    private findFriendDisplayName() {
        this.uid1Subscription = this.db.object('chats/' + this.chatKey + '/uid1').subscribe((uid1) => {
            this.uid2Subscription = this.db.object('chats/' + this.chatKey + '/uid2').subscribe((uid2) => {
                this.friendUID = uid1.$value === this.userUID ? uid2.$value : uid1.$value;
                this.friendSubscription = this.db.object('user-profiles/' + this.friendUID).subscribe((friendData) => {
                    this.friendDisplayName = friendData['display-name'];
                    this.friendPhotoURL = friendData['photo-url'];
                    let currDate: Date;
                    currDate = new Date();
                    currDate.setTime(currDate.getTime() + currDate.getTimezoneOffset() * 60 * 1000);
                    let lastInteractedObject: FirebaseObjectObservable<any>;
                    lastInteractedObject = this.db.object('/friend-lists/' + this.userUID + '/' + this.friendUID + '/last-interacted');
                    lastInteractedObject.set(currDate.getTime());
                });
            });
        });
    }

    private tryToLoadMoreData(): void {
        if (this.canLoadMoreData) {
            this.limit.next(this.limit.getValue() + this.PAGE_SIZE);
        }
    }

    public sendMessage(form: NgForm): void {
        if (form.valid) {
            let currDate: Date;
            currDate = new Date();
            currDate.setTime(currDate.getTime() + currDate.getTimezoneOffset() * 60 * 1000);
            this.messageListArray.push(
                {
                    'text': form.value.text,
                    'poster-display-name': this.userDisplayName,
                    'poster-uid': this.userUID,
                    'post-time': currDate.getTime() // For internationalization purposes
                });
            form.resetForm();

            if (this.shouldDeleteOldMessages) {
                this.deleteOldMessages();
            }
        }
    }

    private deleteOldMessages() {
        if (this.totalMessages >= this.PAGE_SIZE) {
            const component = this;
            this.db.object('chats/' + this.chatKey + '/messages/' + this.lastKey).set(null).then(function () {
                component.deleteOldMessages();
            });
        }
    }

    ngOnDestroy() {
        this.paramSubscription.unsubscribe();
        this.lastKeySubscription.unsubscribe();
        this.messageListArraySubscription.unsubscribe();
        this.uid1Subscription.unsubscribe();
        this.uid2Subscription.unsubscribe();
    }
}

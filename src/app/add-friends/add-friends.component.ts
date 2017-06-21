import {Component, OnDestroy, OnInit} from '@angular/core';
import {AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable} from 'angularfire2/database';
import {AuthService} from '../providers/auth.service';
import {NgForm} from '@angular/forms';
import {Subscription} from 'rxjs/Subscription';
import {Router} from '@angular/router';

@Component({
    selector: 'app-add-friends',
    templateUrl: './add-friends.component.html',
    styleUrls: ['./add-friends.component.css']
})
export class AddFriendsComponent implements OnInit, OnDestroy {

    public searchText: string;
    public searchResults: FirebaseListObservable<any[]>;
    private searchSubscription: Subscription;
    private userUID: string;
    private userDisplayName: string;
    private userEmail: string;
    private friendObject: FirebaseObjectObservable<any>;
    private checkFriendSubscription: Subscription;
    private friendProfileObject: FirebaseObjectObservable<any>;
    private friendProfileSubscription: Subscription;
    private otherFriendRequestObject: FirebaseObjectObservable<any>;
    private otherFriendRequestSubscription: Subscription;

    constructor(public authService: AuthService, private db: AngularFireDatabase, private router: Router) {
    }

    ngOnInit() {
        this.authService.afAuth.auth.onAuthStateChanged((auth) => {
            if (auth == null) {
                // not logged in
                this.userUID = '';
            } else {
                // logged in
                this.userUID = auth.uid;
                this.userEmail = auth.email;
                this.userDisplayName = auth.displayName;
            }
        });
    }

    public onSearch(form: NgForm) {
        this.searchText = null;
        if (form.valid) {
            this.searchResults = this.db.list('user-profiles', {
                query: {
                    orderByChild: 'email',
                    equalTo: form.value.email,
                }
            });

            this.searchSubscription = this.searchResults.subscribe((data) => {
                if (data.length <= 0) {
                    this.searchText = 'No results found';
                }
            });
        } else {
            this.searchText = 'Please input a valid email address';
        }
    }

    private sendFriendRequest(friendUID) {
        if (this.userUID === friendUID) {
            this.searchText = 'You can\'t send a friend request to yourself';
        } else {
            this.friendObject = this.db.object('friend-lists/' + this.userUID + '/' + friendUID);
            this.checkFriendSubscription = this.friendObject.subscribe((data) => {
                if (data.$value !== null) {
                    this.searchText = 'Friend request already sent';
                } else {
                    // Make sure friend hasn't already sent the user a friend request
                    this.otherFriendRequestObject = this.db.object('friend-requests/' + this.userUID + '/' + friendUID);
                    this.otherFriendRequestSubscription = this.otherFriendRequestObject.subscribe((otherRequest) => {
                        if (otherRequest.$value !== null) {
                            this.searchText = otherRequest['display-name'] + ' has already sent you a friend request';
                        } else {
                            this.searchText = 'Friend request sent';
                            const chatKey = this.makeChat(friendUID, this.userUID);

                            this.checkFriendSubscription.unsubscribe();
                            this.friendProfileObject = this.db.object('user-profiles/' + friendUID);
                            this.friendProfileSubscription = this.friendProfileObject.subscribe((friendData) => {
                                let currDate: Date;
                                currDate = new Date();
                                currDate.setTime(currDate.getTime() + currDate.getTimezoneOffset() * 60 * 1000);
                                this.friendObject.set({
                                    'chat-key': chatKey,
                                    'display-name': friendData['display-name'],
                                    'email': friendData['display-name'],
                                    'last-interacted': currDate.getTime(),
                                    'uid': friendData['uid']
                                });
                                let friendRequestObject;
                                friendRequestObject = this.db.object('friend-requests/' + friendUID + '/' + this.userUID);
                                friendRequestObject.set({
                                    'uid': this.userUID,
                                    'email': this.userEmail,
                                    'display-name': this.userDisplayName,
                                    'time-sent': currDate.getTime(),
                                    'chat-key': chatKey,
                                    'accepted': false // Not really necessary to define here as Firebase stores this as null
                                });

                                this.friendProfileSubscription.unsubscribe();
                                this.checkFriendSubscription.unsubscribe();
                            });
                        }
                    });
                }
            });
        }
    }


    private makeChat(uid1, uid2) {
        if (uid1 > uid2) {
            let temp;
            temp = uid1;
            uid1 = uid2;
            uid2 = temp;
        }
        let chatKey;
        let currDate: Date;
        currDate = new Date();
        currDate.setTime(currDate.getTime() + currDate.getTimezoneOffset() * 60 * 1000);
        chatKey = this.db.list('/chats').push({
            uid1: uid1,
            uid2: uid2,
            messages: {
                message1: {
                    'post-time': currDate.getTime(),
                    'poster-display-name': 'Bot',
                    'text': 'You can send messages now, but your friend won\'t be able to see' +
                    ' your messages before accepting your friend request'
                }
            }
        }).key;
        return chatKey;
    }

    public navigateTo(route) {
        this.router.navigate([route]);
    }

    ngOnDestroy(): void {
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }
        if (this.checkFriendSubscription) {
            this.checkFriendSubscription.unsubscribe();
        }
        if (this.friendProfileSubscription) {
            this.friendProfileSubscription.unsubscribe();
        }
        if (this.otherFriendRequestSubscription) {
            this.otherFriendRequestSubscription.unsubscribe();
        }
    }
}

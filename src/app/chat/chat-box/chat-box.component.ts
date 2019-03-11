import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef } from '@angular/core';
import { SocketService } from './../../socket.service';
import { AppService } from './../../app.service';

import { Router } from '@angular/router';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ToastrService } from 'ngx-toastr';
import { ChatMessage } from './chat';
import { CheckUser } from 'src/app/CheckUser';

@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.css'],
  providers: [SocketService]
})
export class ChatBoxComponent implements OnInit, CheckUser {
  @ViewChild('scrollMe', { read: ElementRef })

  public scrollMe: ElementRef;

  public unReadMessages: any;
  public userFullName: any;
  public authToken: any;
  public userInfo: any;
  public userList: any = [];
  public disconnectedSocket: boolean;

  public scrollToChatTop = false;

  public receiverId: any;
  public receiverName: any;
  public previousChatList: any = [];
  public messageText: any;
  public messageList: any = []; // stores the current message list display in chat box
  public pageValue = 0;
  public loadingPreviousChat = false;
  public unseenchatUserList: any = [];




  constructor(
    // tslint:disable-next-line:no-shadowed-variable
    public AppService: AppService,
    // tslint:disable-next-line:no-shadowed-variable
    public SocketService: SocketService,
    public router: Router,
    private toastr: ToastrService,
    vcr: ViewContainerRef
  ) {
    this.receiverId = Cookie.get('receiverId');
    // this.receiverName = Cookie.get('receiverName');


    // this.toastr.setRootViewContainerRef(vcr);


  }



  ngOnInit() {

    console.log('chat box component on init called');

    this.authToken = Cookie.get('authtoken');

    this.userInfo = this.AppService.getUserInfoFromLocalstorage();

    this.receiverId = Cookie.get('receiverId');

    // this.receiverName = Cookie.get('receiverName');

    console.log(this.receiverId, this.receiverName);

    // if (this.receiverId != null && this.receiverId != undefined && this.receiverId != '') {
    //   this.userSelectedToChat(this.receiverId, this.receiverName)
    // }

    this.checkStatus();

    this.verifyUserConfirmation();
    this.getOnlineUserList();

    this.getMessageFromAUser();
    // this.getUnseenChatUserList();



  }

  // to check whether user is authorized or not
  public checkStatus: any = () => {

    console.log('chat checkstatus function is called');
    if (Cookie.get('authtoken') === undefined || Cookie.get('authtoken') === '' || Cookie.get('authtoken') === null) {

      this.router.navigate(['/']);

      return false;

    } else {

      return true;

    }

  } // end checkStatus



  public verifyUserConfirmation: any = () => {

    console.log('chat verifyUserConfirmation function is called');

    this.SocketService.verifyUser()
      .subscribe((data) => {

        console.log('verfyuser dataa', data);

        this.disconnectedSocket = false;

        this.SocketService.setUser(this.authToken);

      });
  }


  public getOnlineUserList: any = () => {

    console.log('chat getOnlineUserList function is called');


    this.SocketService.onlineUserList()
      .subscribe((userList) => {
        console.log(userList);
        this.userList = [];
        console.log(userList);

        console.log(this.unseenchatUserList);

        // tslint:disable-next-line:forin
        for (const x in userList) {

          // tslint:disable-next-line:forin
          // for (const user in this.unseenchatUserList) {
          //   console.log(this.unseenchatUserList[user].firstName);
          //   this.userFullName = this.unseenchatUserList[user].firstName + ' ' + this.unseenchatUserList[user].lastName;
          //   console.log(this.userFullName);
          //   if (this.userFullName === userList[x]) {
          //     this.unReadMessages = 1;

          //   } else {
          //     this.unReadMessages = 0;
          //   }

          // }


          const temp = { 'userId': x, 'name': userList[x], 'unread': this.unReadMessages, 'chatting': false };


          this.userList.push(temp);

        }

        console.log(this.userList);

      }); // end online-user-list
  }

  // chat related methods

  // below fn is used to change current receiver as per the click
  // is when we click on mohit ,mohit chat window will appear
  public userSelectedToChat: any = (id, name) => {

    console.log('userSelectedToChat fn is called');

    console.log('setting user as active');
    console.log(name);

    // setting that user to chatting true
    this.userList.map((user) => {
      console.log('sjsis');
      if (user.userId === id) {
        console.log('hhs');
        user.chatting = true;
      } else {
        user.chatting = false;
      }
    });


    Cookie.set('receiverId', id);

    Cookie.set('receiverName', name);

    console.log(Cookie.get('receiverName'));


    this.receiverName = name;

    this.receiverId = id;

    this.messageList = [];

    this.pageValue = 0;

    const chatDetails = {
      userId: this.userInfo.userId,
      senderId: id
    };


    this.SocketService.markChatAsSeen(chatDetails);

    this.getPreviousChatWithAUser();
    // this.getUnseenChatUserList();
    this.getOnlineUserList();

  } // end userBtnClick function

  public sendMessageUsingKeypress: any = (event) => {

    if (event.keyCode === 13) { // 13 is keycode of enter.

      this.sendMessage();

    }

  }

  public sendMessage: any = () => {

    if (this.messageText) {

      const chatMsgObject: ChatMessage = {
        senderName: this.userInfo.firstName + ' ' + this.userInfo.lastName,
        senderId: this.userInfo.userId,
        receiverName: Cookie.get('receiverName'),
        receiverId: Cookie.get('receiverId'),
        message: this.messageText,
        createdOn: new Date()
      }; // end chatMsgObject
      console.log(chatMsgObject);
      this.SocketService.SendChatMessage(chatMsgObject);
      this.pushToChatWindow(chatMsgObject);


    } else {
      this.toastr.warning('text message can not be empty');

    }

  }

  public pushToChatWindow: any = (data) => {

    console.log('pushtochatwindow fn is called');

    this.messageText = '';
    this.messageList.push(data);
    this.scrollToChatTop = false;
    console.log('message list is', this.messageList);


  }





  public getPreviousChatWithAUser: any = () => {

    console.log('getPreviousChatWithAUser is called');
    const previousData = (this.messageList.length > 0 ? this.messageList.slice() : []);
    console.log(previousData);
    this.SocketService.getChat(this.userInfo.userId, this.receiverId, this.pageValue * 10)
      .subscribe((apiResponse) => {

        console.log(apiResponse);

        if (apiResponse.status === 200) {

          this.messageList = apiResponse.data.concat(previousData);
          console.log(this.messageList);

        } else {

          this.messageList = previousData;
          this.toastr.warning('No Messages available');



        }

        this.loadingPreviousChat = false;
        console.log('message list=', this.messageList);

      }, (err) => {

        this.toastr.error('some error occured');


      });

  }// end get previous chat with any user// end get previous chat with any user

  // called from HTML
  public loadEarlierPageOfChat: any = () => {

    this.loadingPreviousChat = true;

    this.pageValue++;
    this.scrollToChatTop = true;

    this.getPreviousChatWithAUser();

  }// end loadPreviousChat


  // public getUnseenChatUserList: any = () => {

  //   console.log('hh');

  //   return this.SocketService.getUnseenChatUserList(this.userInfo.userId)
  //     .subscribe((apiResponse) => {

  //       console.log(apiResponse.status);
  //       this.unseenchatUserList = [];

  //       if (apiResponse.status === 200) {

  //         console.log('hh');

  //         this.unseenchatUserList = apiResponse.data;
  //         console.log(this.unseenchatUserList);

  //       } else {
  //         console.log('no unseen user list are there');
  //       }


  //     }
  //     );
  // }


  // now ,for receiving the message in the desired chat window
  // here this.receiverId refer to person whose  chat window is open in front of us
  // and data .senderId refers to sneder of the chat message
  public getMessageFromAUser: any = () => {

    console.log('chat getMessageFromAUser fn called');

    this.SocketService.chatByUserId(this.userInfo.userId)
      .subscribe((data) => {
        console.log('data from api useriD for receiving messages', data);
        console.log('hhhh');


        // tslint:disable-next-line:no-unused-expression
        (this.receiverId === data.senderId) ? this.messageList.push(data) : '';
        console.log(this.messageList);

        this.toastr.success(`${data.senderName} says : ${data.message}`);

        this.scrollToChatTop = false;

      }); // end subscribe

  }





  public logout: any = () => {

    this.AppService.logout()
      .subscribe((apiResponse) => {

        if (apiResponse.status === 200) {
          console.log('logout called');
          Cookie.delete('authtoken');

          Cookie.delete('receiverId');

          Cookie.delete('receiverName');

          this.SocketService.exitSocket();

          this.router.navigate(['/']);

        } else {
          this.toastr.error(apiResponse.message);
          console.log('logout called');
          Cookie.delete('authtoken');

          Cookie.delete('receiverId');

          Cookie.delete('receiverName');

          this.SocketService.exitSocket();

          this.router.navigate(['/']);

        } // end condition

      }, (err) => {
        this.toastr.error('some error occured');


      });

  } // end logout

  public showUserName = (name: string) => {

    this.toastr.success('You are chatting with ' + name);

  }
}


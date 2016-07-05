Chats = new Mongo.Collection("chats");

if (Meteor.isClient) {
  /*SUBSCRIPTIONS*/
  Meteor.subscribe('chats');
  Meteor.subscribe('userData');
  
  /*ROUTES*/
  // set up the main template the the router will use to build pages
  Router.configure({
    layoutTemplate: 'ApplicationLayout'
  });
  // specify the top level route, the page users see when they arrive at the site
  Router.route('/', function () {
    Session.set("chatId", "");
    this.render("navbar", {to:"header"});
    this.render("lobby_page", {to:"main"});  
  });

  // specify a route that allows the current user to chat to another users
  Router.route('/chat/:_id', function () {
    var currentUserId = Meteor.userId();
    var otherUserId = this.params._id;
    
    Meteor.call('findOrCreateChat', currentUserId, otherUserId, function(err, chatId) {
      if (err) {
        console.log('Error: Could not retrieve chat. Make sure you are logged in.');
        return;
      }
      Session.set("chatId", chatId);
    });

    this.render("navbar", {to:"header"});
    this.render("chat_page", {to:"main"});  
  }, { name: 'chat'});
  
  Router.onBeforeAction(function() {
    if (!Meteor.userId()) {
      this.redirect('/');
    } else {
      this.next();
    }
  }, { only: ['chat'] });

  /*HELPERS*/
  Template.available_user_list.helpers({
    users:function(){
      return Meteor.users.find();
    }
  });
  
  Template.available_user.helpers({
    getUsername:function(userId){
      var user = Meteor.users.findOne({_id:userId});
      return user.profile.username;
    }, 
    isMyUser:function(userId){
      if (userId == Meteor.userId()){
        return true;
      }
      else {
        return false;
      }
    }
  });

  Template.chat_page.helpers({
    messages:function(){
      var chat = Chats.findOne({ _id:Session.get("chatId") });
      if (!chat) { return; }
      return chat.messages;
    },
    other_user:function(){
      var chat = Chats.findOne({ _id:Session.get("chatId") });
      if (!chat) { return; }
      var other = chat.user1Id === Meteor.userId() ? chat.user2Id : chat.user1Id;
      return Meteor.users.findOne(other).profile.username;
    },
  });
  
  /*EVENTS*/
  Template.chat_page.events({
    // this event fires when the user sends a message on the chat page
    'submit .js-send-chat':function(event){
      event.preventDefault();
      var message = {
                      text: event.target.chat.value,
                      userId: Meteor.userId(),
                    };
      var chatId = Session.get("chatId");
      Meteor.call('updateMessages', chatId, message, function(err, res) {
        if (err) {
          console.log('Error: Could not add message.');
        }
        event.target.chat.value = "";
      });
    },
  });
 
  Template.chat_message.helpers({
    userProfile: function(userId){
      var user = Meteor.users.findOne(userId);
      if (!user) { return; }
      return user.profile;
    },
  });
}


// start up script that creates some users for testing
// users have the username 'user1@test.com' .. 'user8@test.com'
// and the password test123 

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (!Meteor.users.findOne()){
      for (var i=1;i<9;i++){
        var email = "user"+i+"@test.com";
        var username = "user"+i;
        var avatar = "ava"+i+".png"
        console.log("creating a user with password 'test123' and username/ email: "+email);
        Meteor.users.insert({profile:{username:username, avatar:avatar}, emails:[{address:email}],services:{ password:{"bcrypt" : "$2a$10$I3erQ084OiyILTv8ybtQ4ON6wusgPbMZ6.P33zzSDei.BbDL.Q4EO"}}});
      }
    } 
  });
  
  /*PUBLICATIONS*/
  Meteor.publish('chats', function chatsPublication() {
    return Chats.find({ $or: [{ user1Id: this.userId }, { user2Id: this.userId }] });
  });
  
  Meteor.publish('userData', function usersPublication() {
    return Meteor.users.find({}, { fields: { profile: 1 } });
  });
}

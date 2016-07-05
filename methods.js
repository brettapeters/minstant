if (Meteor.isServer) {
  Meteor.methods({
    findOrCreateChat: function(user1Id, user2Id) {
      check(user1Id, String);
      check(user2Id, String);
      
      var filter = { $or:[
                      { user1Id, user2Id }, 
                      { user2Id: user1Id, user1Id: user2Id }] };
      var chat = Chats.findOne(filter);
      
      if (chat) {
        return chat._id;
      }
      else {
        return Chats.insert({ user1Id, user2Id });
      }
    },
    updateMessages: function(chatId, message) {
      var NonEmptyString = Match.Where(function (x) {
        check(x, String);
        return x.length > 0;
      });
      check(chatId, String);
      check(message, {
        text: NonEmptyString,
        userId: String,
      });
      
      var chat = Chats.findOne(chatId);
      if (!chat.messages) {
        chat.messages = [];
      }
      chat.messages.push(message);
      
      Chats.update({ _id: chatId } , chat);
    },
  })
}
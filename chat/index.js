var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis').createClient();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('user connected');


  socket.on ('joinRoom', function (room, user){
    console.log('loggin into room ' + room + ' user: '+user);


    socket.emit('userJoined', room);
    socket.join(room);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('joinChat', function (room, user){
    console.log('Loggin from chat');

    socket.join(room);
    io.sockets.in(room).emit('loadSavedMessages');
  });




  // socket.on('send', function(room, message, userName, timeStamp, uid) {
  //       console.log('sending message and room ' + room +", message: " + message + " from: " + userName + " at " + timeStamp);
  //       //var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'"}';
  //       var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'",'+'"toUser":"'+toUser+'"}';
  //       var text = JSON.parse(chatMsg);
  //       redis.lpush(room, JSON.stringify(text), function(erro, res) {
  //         redis.lrange(room, 0 , -1 , function (erro, msgs) {
  //
  //           io.sockets.in(room).emit('chatMessage', msgs[0]);
  //         });
  //       });
  // });

  socket.on('send', function(room, message, userName, timeStamp, uid, toUser) {
        //console.log('sending message and room ' + room +", message: " + message + " from: " + userName + " at " + timeStamp);
        //var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'"}';
        var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'",'+'"toUser":"'+toUser+'"}';
        var text = JSON.parse(chatMsg);
        redis.rpush(room, JSON.stringify(text), function(erro, res) {
          redis.rpush(toUser, JSON.stringify(text), function(erro, res) {
            redis.lrange(room, 0 , -1 , function (erro, msgs) {
              io.sockets.in(room).emit('chatMessage', msgs[msgs.length -1]);
              io.sockets.in(toUser).emit('chatMessage', msgs[msgs[msgs.length -1]]);
            });
          });
        });

  });


  // socket.on('send', function(room, message, userName, timeStamp, uid) {
  //       console.log('sending message and room ' + room +", message: " + message + " from: " + userName + " at " + timeStamp);
  //       var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'"}';
  //       var text = JSON.parse(chatMsg);
  //       redis.lpush(room, JSON.stringify(text), function(erro, res) {
  //         redis.sort(room,'alpha','limit',0,-1, function(erro, msgs){
  //           io.sockets.in(room).emit('chatMessage', msgs[0]);
  //           io.sockets.in(uid).emit('chatMessage', msgs[0])
  //         });
  //       });
  // });

  // socket.on('send', function(room, message, userName, timeStamp, uid, toUser) {
  //       console.log('sending message and room ' + room +", message: " + message + " from: " + userName + " at " + timeStamp + " TO USER: " + toUser);
  //       var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'"}';
  //       var text = JSON.parse(chatMsg);
  //       io.sockets.in(room).emit('chatMessage', chatMsg);
  //       io.sockets.in(toUser).emit('chatMessage', chatMsg);
  //
  // });

//   socket.on('send', function(room, message, userName, timeStamp, uid, toUser) {
//         console.log('sending message and room ' + room +", message: " + message + " from: " + userName + " at " + timeStamp + " TO USER: " + toUser);
//         var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'"}';
//         var text = JSON.parse(chatMsg);
//
//         redis.lpush(room, JSON.stringify(text), function (erro, res){
//           redis.lpush(room, JSON.stringify(text), function(erro, res) {
//                    redis.lrange(room, 0 , -1 , function (erro, msgs) {
//                      io.sockets.in(room).emit('chatMessage', msgs[0]);
//                      io.sockets.in(toUser).emit('chatMessage', msgs[0]);
//                   });
//         });
//   });
// }

  socket.on('firstMessage', function(room, message, userName, timeStamp, uid, toUser) {
        console.log('sending message and room ' + room +", message: " + message + " from: " + userName + " at " + timeStamp + "TO USER: " + toUser);
        //var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'"}';
        var chatMsg = '{"userName":'+ '"'+userName+'",'+' "timeStamp":'+ '"'+timeStamp+'",'+ '"message":'+ '"'+message+'",' +'"uid":"'+uid+'",'+'"toUser":"'+toUser+'"}';
        var text = JSON.parse(chatMsg);
        //io.sockets.in(room).emit('callForChat', chatMsg);
        //io.sockets.in(toUser).emit('callForChat', chatMsg);

        redis.rpush(room, JSON.stringify(text), function(erro, res) {
          redis.lrange(room, 0 , -1 , function (erro, msgs) {
            io.sockets.in(room).emit('chatMessage', msgs[0]);
            io.sockets.in(toUser).emit('chatMessage', msgs[0]);
          });
        });

  });

  socket.on('loadSavedMessages', function(room){
    redis.lrange(room, 0,-1, function(erro, msgs){
      if (erro === null) {
        msgs.forEach(function(msg){
          //console.log(msg);
          console.log("MESSAGE LOAD TO TABLE: " + msg);

          io.sockets.in(room).emit('loadTable', msg);
          console.log('LOAD TABLE');
        });
      }
    });
  });


  socket.on('loadMessage', function(room){
    redis.lrange(room, 0,-1, function(erro, msgs){
      if (erro === null) {
        msgs.forEach(function(msg){
          //console.log(msg);
          console.log("MESSAGE LOAD: " + msg);
          //socket.emit('chatMessage', msg);

          io.sockets.in(room).emit('chatMessage', msg);
        });
      }
    });
  });


  socket.on ('newMessage', function(room, msg, userName, timeStamp) {
    console.log('New Message ' + msg);
    io.socket.to(room).emit('message', msg);
  });


});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

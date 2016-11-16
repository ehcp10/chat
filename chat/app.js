var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){

	//Aqui o servidor coleta via query string a sala desejada
	var channelId = socket.handshake['query']['channel'];

	if(channelId !== undefined) {
		//Socket se "junta" a sala
		socket.join(channelId);

		socket.on('disconnect', function(){
			console.log("Desconectou...");
		});

		//Escutando evento
		socket.on('emitMessage', function (data) {
			sendUpdate(channelId, data);
		});
	}
});

//Dispara evento para os ouvidores da sala
function sendUpdate(channelId, data) {
	io.to(channelId).emit('receivedUpdate', data);
}

http.listen(3000, function(){
	console.log('Node Start...');
});

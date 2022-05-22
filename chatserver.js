const joinMessage = (nickname) => {return nickname + ' has just joined the chat!';}
const leaveMessage = (nickname) => {return nickname + ' is not here with us, anymore.'}

module.exports = (app) => {

let connectedUsers = []; // {socket, nick, priv}

var server = app.listen(process.env.PORT || 3102, function() {
    console.log('server listening at', server.address())
});
var io = require('socket.io')(server);

/* Function to add {socket, nick, priv} object to connectedUsers array.  */
/* Presumably, to be called by connect event listener. */

const addUser = (socket, err) => {
	connectedUsers.forEach((user) => {
		if(user.socket.id === socket.id){err(); return;}
	})
	connectedUsers.push({"socket":socket, "nick":socket.id, "priv":0});
}

/* Function to remove {socket, nick, priv} object from connectedUsers array.  */
/* Presumably, to be called by disconnect event listener. */

const removeUser = (socket, err) => {
	connectedUsers = connectedUsers.filter(user => user.socket!==socket);
}

const findUserByNick = (nick) => {
	return connectedUsers.find(user => user.nick === nick);
}

const findUserBySocket = (socket) => {
	return connectedUsers.find(user => user.socket === socket);
}

/* 
   Function to process user commends.  
   Takes '[command] [target]' string as an input, ex. 'kick anna12'.
   Slash is ommited by frontend (see script in index.html)
*/


const handleCommand = (command, socket) => {
	//gets ex. "kick amber66"
	console.log(command);
	let commandPayload = command.text.split(' ');
	switch (commandPayload[0]){
	case 'kick':
		const target = connectedUsers.find(user => user.nick===commandPayload[1]).socket;
		if(target){
			target.disconnect();
		}
		else{
			socket.emit('msg', JSON.stringify({type: "global", from: "Server", text: "no such user!"}));
		}
		break;
	case 'nick':
		if(findUserByNick(commandPayload[1])){socket.emit('msg', JSON.stringify({type: "global", from: "Server", text: "hey! it's already taken"})); return;}
		findUserBySocket(socket).nick = commandPayload[1];
		break;
	case 'play':
		if(!commandPayload[1]) {
			socket.emit('msg', JSON.stringify({type: "global", from: "Server", text: "No video specified."}));
			return;
		}
		io.emit('playerControl', JSON.stringify({type: "play", from: "Server", text: commandPayload[1].split('?v=')[1]}));
		io.emit('msg', JSON.stringify({type: "global", from: "Server", text: connectedUsers.find(user => user.socket===socket) + " played: " + commandPayload[1] }));
		console.log("play!");
		break;
	case 'pause':
		console.log("pause!");
		io.emit('playerControl', JSON.stringify({type: "pause", from: "Server", text: ""}));
		break;
	case 'resume':
		console.log("resume!");
		io.emit('playerControl', JSON.stringify({type: "resume", from: "Server", text: ""}));
		break;
	}

} 



/* Routes messages to appropriate targets: global, specified user, or command processor executeCommand() */

const handleMessage = (msg, socket) => {
	// msg should be a parsed JSON object

	switch (msg.type){
	case 'global':
		  const sender = connectedUsers.find(user => user.socket===socket);
		  const message = {type: "global", from: sender.nick, text: msg.text};
		  io.emit('msg', JSON.stringify(message));
		  break;
	case 'private':
		  //not yet implemented
		  break;
	case 'command':
		  executeCommand(msg.text, socket);
	default:
		  //throw some error
		  break;
	}
}


io.on("connection", (socket) => {
	
	/* User has joined, so call addUser on connectedUsers array, and notify participants and console */ 
	
	addUser(socket, ()=>{
		socket.emit('msg', JSON.stringify({type: 'private', from: '', text: 'You are already connected.'}));
		socket.disconnect();
	});
	
	console.log(joinMessage(socket.id));
	io.emit('msg', JSON.stringify({type: "global", from: "Server", text: joinMessage(socket.id)}));
	
	/* Handle incoming messages*/ 
	
	socket.on('msg', (message) => {
		let messageObj = JSON.parse(message);
		handleMessage(messageObj, socket);
		console.log('[' + messageObj.type + ']' + socket.id + " says: " + messageObj.text);
	});

	socket.on('cmd', (message) => {
		let messageObj = JSON.parse(message);
		handleCommand(messageObj, socket);
		console.log(socket.id + " commands: " + messageObj.text);
	});

	
	/* Handle disconnection: removeUser from connectedUsers array and notify participants and console */ 
	
	socket.on('disconnect', () => {
		removeUser(socket);
		console.log(leaveMessage(socket.id));
		io.emit('msg', JSON.stringify({type: "global", from: "Server", text: leaveMessage(socket.id)}));
	})
})

/* Some basic error handler - more tbd... */

io.engine.on("connection_error", (err) => {
  console.log(err.req);     
  console.log(err.code);     
  console.log(err.message);  
  console.log(err.context); 
});



}



/* Listening for server terminal commands */




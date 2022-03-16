const express = require('express');
const http = require('http');
const {Server} = require("socket.io");
const stdin = process.openStdin();

// settings
const SERVER_PORT = 3101;
const joinMessage = (nickname) => {return nickname + ' has just joined the chat!';}
const leaveMessage = (nickname) => {return nickname + ' is not here with us, anymore.'}

// http express init
const app = express();
const server = http.createServer(app);
let connectedUsers = []; // {socket, nick, priv}

// starting server instance
const io = new Server(server);

// load index.html to client
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});


/* Function to add {socket, nick, priv} object to connectedUsers array.  */
/* Presumably, to be called by connect  event listener. */

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


const executeCommand = (command, socket) => {
	command = command.split(' ');
	switch (command[0]){
	case 'kick':
		const target = connectedUsers.find(user => user.nick===command[1]).socket;
		if(target){
			target.disconnect();
		}
		else{
			socket.emit('msg', JSON.stringify({type: "global", from: "Server", text: "no such user!"}));
		}
		break;
	case 'nick':
		if(findUserByNick(command[1])){socket.emit('msg', JSON.stringify({type: "global", from: "Server", text: "hey! it's already taken"})); return;}
		findUserBySocket(socket).nick = command[1];
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
		  console.log("command");
		  executeCommand(msg.text, socket);
	default:
		  //throw some error
		  break;
	}
}


io.on("connection", (socket) => {
	
	/* User has joined, so call addUser to connectedUsers array, and notify participants and console */ 
	
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


server.listen(SERVER_PORT, () => {
	console.log('Server started to listen!');
	console.log('type off to shut down.')
});

/* Listening for server terminal commands */

stdin.addListener("data", (d) => {	
	switch (d.toString().trim()){
	case 'off':
		shutdown();
		break;
	default:
		console.log("Unknown input!");
		break;
	}
})

/* To properly shut down the server (disconnecting all sockets, making the port free to be used again): */

async function shutdown(){
	io.close(() => {
		//fired when all connectons all closed
		console.log('Stopping server!');
	});
	
	const sockets = await io.fetchSockets();
	for(const socket of sockets){
		socket.disconnect();
	}
}
module.exports = (server) => {

    let connectedUsers = []; // {socket, nick, priv}
	let currentlyPlaying = {video_id: "nWqaHWACB9E", socket_id: "", timestamp: 0, playing: false}; 

    var io = require('socket.io')(server);

    /* Function to add {socket, nick, priv} object to connectedUsers array.  */
    /* Presumably, to be only called by connection event listener. */

    const addUser = (socket) => {
        connectedUsers.forEach((user) => {
            if (user.socket.id === socket.id) {
                err();
                return;
            }
        })
        connectedUsers.push({
            "socket": socket,
            "nick": socket.id,
            "priv": 0
        });
    }

    /* Function to remove {socket, nick, priv} object from connectedUsers array.  */
    /* Presumably, to be called only by disconnect event listener. */

    const removeUser = (socket) => {
        connectedUsers = connectedUsers.filter(user => user.socket !== socket);
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
       Slash is ommited by frontend script.
    */

    const handleCommand = (command, socket) => {
        let commandPayload = command.text.split(' ');
        switch (commandPayload[0]) {
            case 'kick':
                const target = connectedUsers.find(user => user.nick === commandPayload[1]).socket;
                if (target) {
                    target.disconnect();
                } else {
                    socket.emit('msg', JSON.stringify({
                        type: "global",
                        from: "Server",
                        text: "no such user!"
                    }));
                }
                break;
            case 'nick':
                if (findUserByNick(commandPayload[1])) {
                    socket.emit('msg', JSON.stringify({
                        type: "global",
                        from: "Server",
                        text: "hey! it's already taken"
                    }));
                    return;
                }
                findUserBySocket(socket).nick = commandPayload[1];
                break;
            case 'play':
                if (!commandPayload[1]) {
                    socket.emit('msg', JSON.stringify({
                        type: "global",
                        from: "Server",
                        text: "No video specified."
                    }));
                    return;
                }
                io.emit('playerControl', JSON.stringify({
                    type: "play",
                    from: socket.id,
                    text: commandPayload[1].split('?v=')[1]
                }));
                io.emit('msg', JSON.stringify({
                    type: "global",
                    from: "Server",
                    text: connectedUsers.find(user => user.socket === socket).nick + " played: " + commandPayload[1]
                }));
				currentlyPlaying = {video_id: commandPayload[1].split('?v=')[1], socket_id: socket.id, timestamp: 0, playing: true}
                console.log("play!");
                break;
            case 'pause':
                console.log("pause!");
                io.emit('playerControl', JSON.stringify({
                    type: "pause",
                    from: "Server",
                    text: ""
                }));
				currentlyPlaying.playing = false;
                break;
            case 'resume':
                console.log("resume!");
                io.emit('playerControl', JSON.stringify({
                    type: "resume",
                    from: "Server",
                    text: ""
                }));
				currentlyPlaying.playing = true;
                break;
			case 'jump':
				console.log("jump + " + commandPayload[1]);
				io.emit('playerControl', JSON.stringify({
					type: "jump",
					from: "Server",
					text: commandPayload[1]
				}));
				break;
			case 'timestamp':
				console.log("timestamp notify + " + commandPayload[1]);
				currentlyPlaying.timestamp = commandPayload[1];

        }

    }

    /* Routes messages to appropriate targets: global, specified user, or command processor executeCommand() */

    const handleMessage = (msg, socket) => {
        // msg should be a parsed JSON object

        switch (msg.type) {
            case 'global':
                const sender = connectedUsers.find(user => user.socket === socket);
                const message = {
                    type: "global",
                    from: sender.nick,
                    text: msg.text
                };
                io.emit('msg', JSON.stringify(message));
                break;
            case 'private':
                //not yet implemented
                break;
            default:
                break;
        }
    }

    io.on("connection", (socket) => {

        /* User has joined, so call addUser on connectedUsers array, and notify participants and console */

        addUser(socket);

        console.log(findUserBySocket(socket).nick + ' has just joined the chat!');
        io.emit('msg', JSON.stringify({
            type: "global",
            from: "Server",
            text: findUserBySocket(socket).nick + ' has just joined the chat!'
        }));

		socket.emit('playerControl', JSON.stringify({
			type: "play",
			from: currentlyPlaying.socket_id,
			timestamp: currentlyPlaying.timestamp,
			autoplay: currentlyPlaying.playing,
			text: currentlyPlaying.video_id
		}))
		
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
            console.log(findUserBySocket(socket).nick + ' is not here with us, anymore.');
            io.emit('msg', JSON.stringify({
                type: "global",
                from: "Server",
                text: findUserBySocket(socket).nick  + ' is not here with us, anymore.'
            }));

			if(currentlyPlaying.socket_id === socket.id){
				io.emit('playerControl', JSON.stringify({
                    type: "pause",
                    from: "Server",
                    text: ""
                }));
				currentlyPlaying.playing = false;

				io.emit('msg', JSON.stringify({
					type: "global",
					from: "Server",
					text: 'Video auto-paused (no video admin in the room).'
				}));
			}

			removeUser(socket);
        })

    })

    /* error handler - tbd... */
    io.engine.on("connection_error", (err) => {
        console.log(err.req);
        console.log(err.code);
        console.log(err.message);
        console.log(err.context);
    });



}

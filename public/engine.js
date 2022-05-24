var socket = io();
	
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const playerBox = document.getElementById('player-box');
const controls = document.getElementById('controls');

const testbutton  = document.getElementById('testbutton');
const playButton = document.getElementById('button_play');
const pauseButton = document.getElementById('button_pause');
const unmuteButton = document.getElementById('button_unmute');
const hostVideoButton = document.getElementById('button_hostvideo');
const setNicknameButton = document.getElementById('button_setnick');
const defaultButton = document.getElementById('button_default')

var playing = false;		
var isVideoOwner = false;

const startPlayback = (obj, player) => {
    if(player)
        player.destroy();

    console.log("play: " + obj.text);

    if(obj.from === socket.id){
        isVideoOwner = true;
        controls.style.display = "inline"
    } else {
        isVideoOwner = false;
        controls.style.display = "none";
    }
    setTimeout(() => startPlayerInstance(obj.text, isVideoOwner, obj.timestamp, obj.autoplay), 150);
}

const pausePlayback = (player) => {
    if(player.data !== 2){
        playing = false;
        player.pauseVideo();
    }
}

const resumePlayback = (player) => {
    playing = true;
    setTimeout(()=>player.playVideo(), 400);
    console.log("got resume!");
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value.charAt(0)=='/'){ 
        let command = input.value.substr(1);
        let message = {
            from: "",
            text: command
        }
        socket.emit('cmd', JSON.stringify(message));
        input.value = '';

    } else{
        let message = {
            type: "global",
            from: "",
            text: input.value
        }
        socket.emit('msg', JSON.stringify(message));
        input.value = '';
    }
    
});

testbutton.addEventListener('click', function(e) {
    let messageEntity = document.createElement('li');
    playerBox.style = "display: none;";
    messageEntity.innerHTML = "test click";
    messages.appendChild(messageEntity);
})

playButton.addEventListener('click', function(e){
    socket.emit('cmd', JSON.stringify({from: "", text: "resume"}));
})

pauseButton.addEventListener('click', function(e){
    socket.emit('cmd', JSON.stringify({from: "", text: "pause"}));
})

unmuteButton.addEventListener('click', function(e){
    player.unMute();
})

setNicknameButton.addEventListener('click', function(e){
    input.value = "/nick yourName";
})

hostVideoButton.addEventListener('click', function(e){
    input.value = '/play https://www.youtube.com/watch?v=J74QdpV7ruU';
})

socket.on('msg', (message) => {
    console.log('Message: ' + JSON.parse(message).text);
    let messageObject = JSON.parse(message);
    let messageEntity = document.createElement('li');
    messageEntity.innerHTML = "<br><b>"+ messageObject.from + "</b>: " + messageObject.text;
    messages.appendChild(messageEntity);
    
    var objDiv = document.getElementById("chat");
    objDiv.scrollTop = objDiv.scrollHeight;
});

socket.on('playerControl', (message) => {
    let messageObject = JSON.parse(message);
    switch(messageObject.type){
        case 'play':
            startPlayback(messageObject, player);
            break;
        case 'pause':
            pausePlayback(player);
            break;
        case 'resume':
            resumePlayback(player);
            break;
        case 'jump':
            player.seekTo(messageObject.text);
            break;
    }
    console.log('playerControl msg: ' + JSON.parse(message).text);
    
})
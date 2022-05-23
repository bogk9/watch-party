//
// YOUTUBE IFRAME PLAYER API
// controlled by controller.js
// 

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var player;
var iframeWindow;
function startPlayerInstance(videoid, isVideoOwner) {
  player = new YT.Player('player', {
    height: '403',
    width: '718',
    videoId: videoid,
    playerVars: {'controls': isVideoOwner ? 1 : 0},
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  //event.target.playVideo();
  iframeWindow = player.getIframe().contentWindow;
  console.log(player.width);
}

// Manages to keep current player state
// basing on global var playing

async function onPlayerStateChange(event) {
  if(event.data === YT.PlayerState.PLAYING){
    if(isVideoOwner){
      socket.emit('cmd', JSON.stringify({from: "", text: "resume"}));
      return;
    }
    console.log("State is now playing");
    if(!playing){
      setTimeout(() => player.pauseVideo(), 125)
      console.log("reverted pause!");
    }
  } else if(event.data === YT.PlayerState.PAUSED) {
    if(isVideoOwner){
      socket.emit('cmd', JSON.stringify({from: "", text: "pause"}));
      return;
    }
    if(playing){
      setTimeout(() => player.playVideo(), 125)
    }
  }
}

var lastTimeUpdate = 0;

window.addEventListener("message", function(event) {
  // Check that the event was sent from the YouTube IFrame.
  if (event.source === iframeWindow) {
    var data = JSON.parse(event.data);

    // The "infoDelivery" event is used by YT to transmit any
    // kind of information change in the player,
    // such as the current time or a playback quality change.
    if (
      data.event === "infoDelivery" &&
      data.info &&
      data.info.currentTime
    ) {
      // currentTime is emitted very frequently (milliseconds),
      // but we only care about whole second changes.
      var time = Math.floor(data.info.currentTime);

      if (time !== lastTimeUpdate) {
        if(time-lastTimeUpdate !== 1 ) {
          socket.emit('cmd', JSON.stringify({from: "", text: "jump " + time}));
          console.log("jump sent!, current time:" + time + "lastTime: " + lastTimeUpdate);
        }
        lastTimeUpdate = time;
        
        // It's now up to you to format the time.
        document.getElementById("time").innerHTML = time;
        console.log("time: " + time);
      }

     
    }
  }
})


function stopVideo() {
  player.stopVideo();
}

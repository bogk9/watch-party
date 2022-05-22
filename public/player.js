
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function startPlayerInstance(videoid) {
  player = new YT.Player('player', {
    height: '403',
    width: '718',
    videoId: videoid,
    playerVars: {'controls': 0 },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  //event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var stopped = false;
function onPlayerStateChange(event) {


  if(event.data === YT.PlayerState.PLAYING){
    socket.emit('cmd', JSON.stringify({from: "", text: "resume"}));
  } else if(event.data === YT.PlayerState.PAUSED) {
    socket.emit('cmd', JSON.stringify({from: "", text: "pause"}));
  }
  

}
function stopVideo() {
  player.stopVideo();
}

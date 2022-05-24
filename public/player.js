//
// YOUTUBE IFRAME PLAYER API
//
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var player;
var playingFrom = 0;
var autoplay = false;
var iframeWindow;

function startPlayerInstance(videoid, isVideoOwner, from, isServerPlaying) {
    player = new YT.Player('player', {
        height: '403',
        width: '718',
        videoId: videoid,
        playerVars: {
            'controls': isVideoOwner ? 1 : 0,
            'start': from,
            'mute': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    console.log("playing from: " + from);
    playingFrom = from;
    autoplay = isServerPlaying;
    console.log("autoplay: " + autoplay);
}

function onPlayerReady(event) {
    if (playingFrom !== 0 && autoplay) {
        playing = true;
        event.target.playVideo();
    }

    iframeWindow = player.getIframe().contentWindow;
}

// Keeps current player state
// basing on global var playing

async function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        if (isVideoOwner) {
            socket.emit('cmd', JSON.stringify({
                from: "",
                text: "resume"
            }));
            return;
        }
        console.log("State is now playing");
        if (!playing) {
            setTimeout(() => player.pauseVideo(), 125)
            console.log("reverted pause!");
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        if (isVideoOwner) {
            socket.emit('cmd', JSON.stringify({
                from: "",
                text: "pause"
            }));
            return;
        }
        if (playing) {
            setTimeout(() => player.playVideo(), 125)
        }
    }
}


//keeps track of current playback time
var lastTimeUpdate = 0;
window.addEventListener("message", function(event) {
    if (event.source === iframeWindow) {
        var data = JSON.parse(event.data);

        if (
            data.event === "infoDelivery" &&
            data.info &&
            data.info.currentTime
        ) {

            var time = Math.floor(data.info.currentTime);

            if (time !== lastTimeUpdate) {
                if (time - lastTimeUpdate !== 1 && isVideoOwner) {
                    socket.emit('cmd', JSON.stringify({
                        from: "",
                        text: "jump " + time
                    }));
                }
                lastTimeUpdate = time;

                if (isVideoOwner)
                    socket.emit('cmd', JSON.stringify({
                        from: "",
                        text: "timestamp " + time
                    }));

                document.getElementById("time").innerHTML = time;
            }


        }
    }
})

function stopVideo() {
    player.stopVideo();
}
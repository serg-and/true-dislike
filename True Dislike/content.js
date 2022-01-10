const url = window.location.href;
var firstTime = true;

if (url.includes('/watch')) {
    document.addEventListener("DOMContentLoaded", getDislikes())
}else if (url.includes('/videos/upload')) {
    document.addEventListener("DOMContentLoaded", setup())
} else if (url.includes('studio.youtube')) {
    document.addEventListener("DOMContentLoaded", getChannelId())
}

function getDislikes(){
    videoId = new URL(url).search.split('v=')[1].split('&')[0];
    console.log(videoId);
    
    chrome.runtime.sendMessage({
        message: "opened youtube video", 
        id: videoId
    }, (response) => {
        insertDislikes(response);
    });
}

async function insertDislikes(ratio) {
    await waitForEl('#top-level-buttons-computed');
    if (ratio === 0) {
        document.getElementById('top-level-buttons-computed').getElementsByTagName('yt-formatted-string')[1].innerText = '';
    } else {
        let likes = document.getElementById('top-level-buttons-computed').getElementsByTagName('yt-formatted-string')[0].innerText;
        let dislikes = Math.round(likes / ratio) - likes;
        document.getElementById('top-level-buttons-computed').getElementsByTagName('yt-formatted-string')[1].innerText = dislikes;
    }
}

function setup() {
    if (firstTime) {
        setInterval(function() {
            location.reload()
        }, 1000 * 60 * 60);
        
        firstTime = false;
    }
    getLikeRatio();
}

async function getLikeRatio() {
    await waitForEl('.style-scope ytcp-video-section-content');
    videoList = document.getElementsByTagName('ytcp-video-section-content')[0].getElementsByTagName('ytcp-video-row');
    ratios = {}

    for (let i = 0, len = videoList.length; i < len; i++) {
        visablility = videoList[i].getElementsByClassName('label-span style-scope ytcp-video-row')[0].innerText;
        
        if (visablility !== 'Public') continue
        let id = videoList[i].querySelector('#thumbnail-anchor').href.split('/video/')[1].split('/edit')[0];
        let ratio = videoList[i].getElementsByClassName('percent-label style-scope ytcp-video-row')[0].innerText;
        if (parseFloat(ratio)) {
            ratios[id] = parseFloat(ratio) / 100;
        }
    }
    if (Object.keys(ratios).length !== 0) {
        chrome.runtime.sendMessage({
            message: "retrieved dislike count", 
            data: ratios
        });
    }
}

async function getChannelId() {
    await waitForEl('a#overlay-link-to-youtube')
    let channelLink = document.querySelector('a#overlay-link-to-youtube').href
    let channelId = channelLink.split('/channel/')[1].split('/')[0]
    
    chrome.runtime.sendMessage({
        message: "retrieved channel id", 
        id: channelId
    });
}

function waitForEl(el) {
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (document.querySelector(el)) {
                clearInterval(intervalId);
                resolve();
            }
        }, 500);
    });
}  

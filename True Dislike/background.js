document.addEventListener("DOMContentLoaded", setup())

// This is to remove X-Frame-Options header, if present
chrome.webRequest.onHeadersReceived.addListener(
    function(info) {
        var headers = info.responseHeaders;
        var index = headers.findIndex(x=>x.name.toLowerCase() == "x-frame-options");
        if (index !=-1) {
            headers.splice(index, 1);
        }
        return {responseHeaders: headers};
    },
    {
        urls: ['*://studio.youtube.com/*'], //
        types: ['sub_frame']
    },
    ['blocking', 'responseHeaders']
);

async function setup() {
    await waitForEl('#iframe1');
    let ifr = document.getElementById('iframe1');
    ifr.src = 'https://studio.youtube.com/';
}

var ratios = loadRatios();

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.message === "opened youtube video") {
            ratios.then(res => {
                sendResponse(res[request.id])
            })
        } else if (request.message === "retrieved dislike count") {
            console.log(request.data)
            ratios.then(oldRatios => {
                if (typeof oldRatios === 'object') {
                    newRatios = Object.assign(oldRatios, request.data)
                    chrome.storage.local.set({ratios: newRatios});
                } else {
                    chrome.storage.local.set({ratios: request.data});
                }
            })
            ratios = loadRatios()
        } else if (request.message === "retrieved channel id") {
            let ifr = document.getElementById('iframe1');
            ifr.src = `https://studio.youtube.com/channel/${request.id}/videos/upload?filter=%5B%7B%22name%22%3A%22VISIBILITY%22%2C%22value%22%3A%5B%22PUBLIC%22%5D%7D%5D&sort=%7B%22columnType%22%3A%22date%22%2C%22sortOrder%22%3A%22DESCENDING%22%7D`
        } 
    }
);

function loadRatios() {
    return new Promise(function(resolve) {
        chrome.storage.local.get(['ratios'], res => {
            resolve(res['ratios'])
        })
    })
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

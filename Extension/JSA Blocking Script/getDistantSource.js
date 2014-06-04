console.log("getDistantSource content script loaded in web page");
// console.log('URL : ' + document.URL); // TEST de localisation
// console.dir(document); // TEST de localisation

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	sendResponse({content:document.body.innerText});
});
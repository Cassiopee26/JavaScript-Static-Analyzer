function misenforme(html) {
	var message = document.querySelector('#test');
	var paragraphe = new Object();
	for(var i=0; i<html.length;i++) {
		if(html[i]==='//SCRIPTS INTERNES' || html[i]==='//SCRIPTS EXTERNES' || html[i]==='//EVENEMENTS A SCRIPT') paragraphe = document.createElement('h2');
		else paragraphe = document.createElement('div');
		// console.log('HTML CODE : ' + html[i]); // TEST
		paragraphe.innerText=html[i];
		message.appendChild(paragraphe);
	}
}

chrome.runtime.onMessage.addListener(function(request, sender) {
	if(request.status==="posting") {
		misenforme(request.content);
	}
});
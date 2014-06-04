// -----------------------------------------------------------------------------------------------
// BIENVENUE SUR LA PAGE D'ARRIERE-PLAN !
// Cette page est chargee de la communication entre les fichiers de l'extension.
// Elle ouvre les pages Internet requises et y injecte les fichiers de l'extension desires.
// -----------------------------------------------------------------------------------------------

//------------------------------------ COMMUNICATIONS AU SEIN DE L'EXTENSION ------------------------------------
// cet ensemble de fonctions a callback permet :
// - d'ouvrir un port de communication, une fois que getSourceOnWebPage.js a ete lance
// - selon la valeur des messages, de demander l'ouverture de pages et l'execution de scripts
// - enfin, de lancer l'affichage du code recupere
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

	var port = chrome.runtime.connect({name: "undefined"}); // initialisation du canal de communication
	var url = new String(); // URL des pages a ouvrir
	var content = new String(); // contenu des messages recus par background.js
	
	if(request.status ==="waiting for getting external scripts") { // envoye par getSourceOnWebPage.js
		console.log("creating long-lived connection..."); // TEST : controle de la creation du port
		port = chrome.tabs.connect(sender.tab.id,{name: "getting external scripts port"}); // ouverture de la communication par PORT
		port.postMessage({status: "get", content: null}); // message d'initialisation
		
		port.onMessage.addListener(function(msg) { // ajout d'une fonction d'ecoute specifique sur le port ouvert
			console.log("message received : " + msg.status); // TEST : type de message recu
			
			if (msg.status == "open") { // cas demande d'ouverture
				url = msg.content; // url a ouvrir
				console.log("opening : " + url); // TEST : controle de l'URL a ouvrir
				var page_ref = {url:msg.content}; // page a ouvrir
				chrome.tabs.create(page_ref, function (tab) { // creation de la page correspondante
					// console.log("tab id : " + tab.id + ", tab url : " + tab.url); // TEST : creation de la page
					chrome.tabs.executeScript(tab.id, {file: "getDistantSource.js"}, function() {
						if (chrome.extension.lastError) console.error('There was an error injecting script : \n' + chrome.extension.lastError.message);
						else {
							chrome.tabs.sendMessage(tab.id,{status: "getDistantSource"}, function(response) { // demande de recuperation de script
								if (chrome.runtime.lastError) console.error('There was an error receiving message : \n' + chrome.runtime.lastError.message);
								else {
									console.log("got code : \n" + response.content); // TEST : voir le code obtenu
									port.postMessage({status:'ready', content:response.content}); // annoncer au code de recuperation de script que l'on est pret a ouvrir une autre page
									// chrome.tabs.remove(tab.id); // EN COMMENTAIRE pour la version de TEST, pour une version d'implementation, retirer ce commentaire
								}
							});
						}
					});
				});
			}
			
			else if (msg.status =="disconnection") { // fin des demandes d'ouverture
				content = msg.content; // contient maintenant tout le code a afficher
				console.log('disconnection...');
				port.disconnect();
				console.log('displaying...');
				chrome.tabs.create({url:"display.html"}, function(tab) {
					chrome.tabs.sendMessage(tab.id,{status: "posting", content:content});
				});
			}
			
		});
	}
});


//------------------------------------ INITIALISATION ------------------------------------
// la fonction principale :
// - attend le clic sur le bouton de l'extension
// - ouvre une fenetre pour la saisie d'une URL
// - controle l'URL saisie
// - cree la page correspondante
// - injecte le script getSourceOnWebPage dans la page creee afin de recuperer le code HTML
function principale() {
	console.log('Welcome on JavaScript Static Analyzer (vanilla version)'); // TEST : lancement
	var url = new String(); // URL des pages a ouvrir
	var valid_url = new RegExp("^https?://.*$","g"); // controle des URL
	var test = "http://www.netyx.fr/k6op/test/test.html"; // URL de test
	
	chrome.browserAction.onClicked.addListener( function(tab) { // clic sur le bouton de l'extension => activation
		url=prompt("The analysis requires a COMPLETE URL : ", "https://"); // saisie de l'URL a analyser
		if(url!=null) { // presence d'URL
			if (valid_url.test(url) || url==="https://") { // si URL valide
				var page_ref = {url:(url==="https://") ? test: url}; // si l'utilisateur ne modifie pas le texte par defaut ("https://"), passage en mode "test"				
				chrome.tabs.create(page_ref, function(tab) { // creation de la page a analyser
					console.log(url + ' analysis starts.'); // TEST : affichage de l'URL de la page qu'ouvre l'extension
					chrome.tabs.executeScript(tab.id, {file: "getSourceOnWebPage.js"}, function() { // injection du script de recuperation du code source
						if (chrome.extension.lastError) console.error('There was an error injecting script : \n' + chrome.extension.lastError.message);
					});
				});
			}
			else console.error("invalid URL : " + url); // ERREUR
		}
		else console.error("the URL is missing."); // ERREUR
	});
}

//------------------------------------ DEMARRAGE ------------------------------------
// permet d'activer le lancement de la fonction principale
// quand le navigateur est pret a utiliser l'extension :
document.addEventListener('DOMContentLoaded', principale, false);
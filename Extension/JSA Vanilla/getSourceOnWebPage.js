//----------------------------- GESTION DES SCRIPTS -----------------------------
var html = new Array(); // variable ou sera stocke le code a afficher dans display.html

//----------------------------- GESTION DES SCRIPTS EXTERNES -----------------------------
var exScripts=document.querySelectorAll("script[src]"); // recherche de tous les noeuds <script> ayant une propriete src
// console.log(exScripts); // TEST : controle des scripts externes

//----------------------------- GESTION DES SCRIPTS INTERNES -----------------------------
var inScripts = document.querySelectorAll("script:not([src])");  // recherche de tous les noeuds <script> n'ayant pas de propriete src
// console.log(inScripts); // TEST : controle des scripts internes

//-----------------------------RECUPERATION DES SCRIPTS INTERNES -----------------------------
html.push('//SCRIPTS INTERNES');
for(var i=0;i<inScripts.length;i++) {
	html.push(inScripts[i].innerText); // innerText, plutot que innerHTML, pour neutraliser l'eventuel contenu ecrit en HTML
}

//-----------------------------GESTION DES EVENEMENTS A SCRIPT -----------------------------
var eventScripts = new Array(); // contiendra les scripts references utilises dans des evenements
// une liste d'evenements, normalement la plus complete possible :
var events = new Array("load","click","dblclick","mouseover","mouseout", "mousedown","mouseup", "mousemove", "keydown", "keyup", "keypress", "focus", "blur", "change", "select", "submit", "reset");
// gestion de la meme liste, mais avec la mention "on" devant les evenements :
var onevents = new Array();
for(var i=0;i<events.length;i++) {
	onevents[i]="on"+events[i];
	events[i]= "*["+onevents[i]+"]"; // sont ainsi sous la forme d'un critere de recherche
}
eventScripts=document.querySelectorAll(events.join(",")); // pour rechercher dans tout le code toutes les proprietes de la forme "on+event"

// console.dir(onevents); // TEST de construction
// console.dir(events); // IDEM
// console.dir(eventScripts); // TEST : controle du resultat

//----------------------------- AUTRES VARIABLES GLOBALES -----------------------------
var url = new String();
var index = 0;
var balise = new Object();
var attributs = new Object();
var attribut = new Object();
var event = new Object();

//----------------------------- RECUPERATION DES EVENEMENTS A SCRIPT -----------------------------
html.push('//EVENEMENTS A SCRIPT');
// OBJECTIF : afficher pour chaque script lie a un evenement, l'evenement, le type de balise et le script proprement dit.
for(var i=0; i<eventScripts.length;i++) { // eventScripts : liste de noeuds obeissant au critere de recherche vu ci-haut
		// console.log("Balise : "); // TEST
		balise = eventScripts[i];
		attributs = balise.attributes;
		// console.dir(balise); // TEST
		for(var j=0; j<attributs.length;j++) { // parcours de attributes
			// console.log("Attribut : "); // TEST
			attribut = attributs[j];
			// console.dir(attribut); // TEST
			for(var k=0; k<onevents.length;k++) {
				event = onevents[k];
				if(attribut.name===event) {
					// console.log("HTML : " + '{'+balise.tagName+'}'+'['+event+']'+attribut.nodeValue); // TEST
					html.push('//'+'{'+balise.tagName+'}'+'['+event+']'+'\n'+attribut.nodeValue);
				}
			}
		}
}

// ----------------------------- RECUPERATION DES SCRIPTS EXTERNES -----------------------------
chrome.runtime.sendMessage({status: "waiting for getting external scripts"}); // un message est envoye a l'extension : signal de la recuperation des scripts externes

chrome.runtime.onConnect.addListener(function(port) { // communication par port
	html.push('//SCRIPTS EXTERNES');
	// console.log("port connection done with background"); // TEST
	// console.assert(port.name == "getting external scripts port"); // TEST
	port.onMessage.addListener(function(msg) {
		// console.log("INDEX : " + index + ", and length : "  + exScripts.length); // TEST
		console.log("message received : " + msg.status); // TEST
		if (msg.status == "get") { // initialisation
			url = exScripts[index].src;
			console.log("demand to open : " + url); // TEST
			port.postMessage({status:"open", content:url});
			index++;
		}
		else if (msg.status == "ready") { // communication
			html.push(msg.content);
			console.log('HTML code transmitted : \n' + msg.content);
			if (index == exScripts.length) { // cloture
				console.log("last URL opened.");
				port.postMessage({status:"disconnection", content:((html==='') ? 'DEFAULT HTML': html)});	
			}
			else {
				url = exScripts[index].src;
				console.log("demand to open : " + url);
				port.postMessage({status:"open", content:url});
				index++;
			}
		}
	});
});
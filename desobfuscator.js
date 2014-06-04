function desobfuscate(obj, details, counter) {
		
		// Desobfuscation du code
		var unpacked = obj['type'].unpack(editor.getValue());

		// Creation des éléments DOM
		var li = document.createElement('li');
		var br = document.createElement('br');
		var textarea = document.createElement('textarea');
		textarea.setAttribute('class', 'detailsArea');
				
		// Recopiage du code généré dans l'éditeur de code
		editor.getDoc().setValue(unpacked);
		
		// Construction du DOM
		textarea.appendChild(document.createTextNode(unpacked));
		li.appendChild(document.createTextNode(obj['name'] + " détecté : code désobfusqué " + counter));
		li.appendChild(br);
		li.appendChild(textarea);
		details.appendChild(li);
		
		return details;
}

function process() {

	var bool;
	
	// Le compteur permet de compter le nombre de couches d'obfuscation
	var counter = 0;
	
	// Définition des différents obfuscateurs supportés en fonction de la définition donnée dans les fichiers *_unpacker.js
	// La propriété "type" contient le nom de l'objet tel que défini dans les fichiers *_unpack.js
	// La propriété "name" contient le nom utilisé pour l'affichage des résultats
	var obfuscators = [{type: P_A_C_K_E_R, name: "Packer"},
	{type: Urlencoded, name: "Urlencoded"},
	{type: JavascriptObfuscator, name: "JavascriptObfuscator"},
	{type: AAEncode, name: "AAEncode"},
	{type: JJEncode, name: "JJEncode"}];
	
	// Création des éléments DOM
	var details = document.createElement('ol');
	var li = document.createElement('li');
	var br = document.createElement('br');
	var textarea = document.createElement('textarea');
	details.setAttribute('id', 'details');
	textarea.setAttribute('class', 'detailsArea');
	
	// Construction du DOM
	textarea.appendChild(document.createTextNode(editor.getValue()));
	li.appendChild(document.createTextNode("Code original"));
	li.appendChild(br);
	li.appendChild(textarea);
	details.appendChild(li);
	
	// On vide la div de résultat
	document.getElementById('output').innerHTML = "<h1>Désobfuscation</h1>";
	
	var initialValue = editor.getValue();
	
	do{
		bool = false;
		for (var i = 0; i < obfuscators.length; i++) {
			if ((obfuscators[i].type).detect(editor.getValue()))  {
				var obj = obfuscators[i];
				counter++;
				details = desobfuscate(obj, details, counter);
				bool = true;
			}
		}
	} while (bool);
	
	// On attache le bloc contenant tous les détails de la désobfuscation dans la div de résultat
	document.getElementById('output').appendChild(details);
	
	var finalValue = editor.getValue();
	
	// Recopiage du code initial dans l'éditeur de code
	editor.getDoc().setValue(initialValue);
	
	return finalValue;
}


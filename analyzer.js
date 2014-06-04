var compteur = 0;
var tab = new Array(); // tableau contenant les index des instructions 
var index_max = new String();

//-----------------------------------------------------------------------------------------------------------------------------
// Permet d'insérer directement un texte à la suite, dans la div de résultats
//-----------------------------------------------------------------------------------------------------------------------------
function write(text) {
	var output = document.getElementById("output");
	output.innerHTML += text + "<br>";
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet de supprimer les doublons dans un tableau
//-----------------------------------------------------------------------------------------------------------------------------
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

//-----------------------------------------------------------------------------------------------------------------------------
// Retourne un tableau d'indices correspondant à une propriété et une valeur données
//-----------------------------------------------------------------------------------------------------------------------------
function getIndexes(obj, key, val, index) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getIndexes(obj[i], key, val, index+"."+i));    
        } else 
        if (i === key && obj[i] === val || i === key && val === '') { //
            objects.push(index);
        } else if (obj[i] === val && key === ''){
            if (objects.lastIndexOf(index) === -1){
                objects.push(index);
            }
        }
    }
	
    return objects;
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet de récupérer le dernier membre de l'index
//-----------------------------------------------------------------------------------------------------------------------------
function index_abs2rel(index_abs) {
	return index_abs.substring((index_abs.lastIndexOf(".")+1));
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet d'indenter le code dans la zone de saisie
//-----------------------------------------------------------------------------------------------------------------------------
function indentAll(cm) { 
  var last = cm.lineCount(); 
  cm.operation(function() { 
    for (var i = 0; i < last; ++i) cm.indentLine(i); 
  }); 
} 

//-----------------------------------------------------------------------------------------------------------------------------
// Recherche des index des branches de l'arbre dans lesquelles les variables subissent 
// une modification et détection des autres variables présentes dans ces branches
//-----------------------------------------------------------------------------------------------------------------------------
function parcourir(variables, corps, index) {
	var myvar;
	var nvelles_instructions = new Array();
	var instructions = new Array();
	
	for(var k=0; k<variables.length ; k++) {
		myvar=variables[k];
		
		 // donne les blocs de corps où se trouve "myvar" et place leurs indices dans "instructions"
		nvelles_instructions=chercheUneVariableDansPlusieursBlocs(myvar, corps, instructions, index);
		
		if (nvelles_instructions!==null) {
		
			// donne les variables qui se trouvent dans les blocs que l'on n'a pas encore fouillés
			var variables2 = chercherLesVariablesDansPlusieursBlocs(corps, nvelles_instructions,variables, index);

			variables = variables.concat(variables2).unique(); 
		}
	}
	
	tab = tab.concat(instructions);
	
	return instructions;
}
//-----------------------------------------------------------------------------------------------------------------------------
// Permet de trouver les branches dans lesquelles une variable subit une modification
//-----------------------------------------------------------------------------------------------------------------------------
function chercheUneVariableDansPlusieursBlocs(myvar, corps, instructions, index) {
	var nvelles_instructions = new Array();
	for(var k=0 ; k<corps.length ; k++) { // éliminer les indices dans "instructions"
		if(instructions.indexOf(k)===-1) { // on n'a pas encore fouillé dans ce bloc
			bloc = corps[k];
			if (estPresenteDansBloc(myvar, bloc, index + "." + k)) { 
				instructions.push(index + "." + k);
				nvelles_instructions.push(index + "." + k);
			}
		}
	}
	return nvelles_instructions;
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet de chercher les différentes variables présentes dans les branches relevées
//-----------------------------------------------------------------------------------------------------------------------------
function chercherLesVariablesDansPlusieursBlocs(corps, nvelles_instructions, variables, index) {
	var res = new Array();
	var nvelles_variables = new Array();
	var bloc = new Object();
	for(var k=0 ; k<nvelles_instructions.length ; k++) {
		bloc=corps[index_abs2rel(nvelles_instructions[k])]; 
		nvelles_variables=chercherLesVariablesDansUnSeulBloc(variables, bloc, index);
		res=res.concat(nvelles_variables).unique();
	}
	return res;
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet de voir si une variable subit une modification dans une branche donnée ou pas
//-----------------------------------------------------------------------------------------------------------------------------
function estPresenteDansBloc(v, bloc, index) {
	var res = false;
	var sbloc = new Object();
	var res1 = new Boolean();
	var res2 = new Boolean();

	switch (bloc.type) {
		case "AssignmentExpression":
			res1 = estPresenteDansBloc(v, bloc.left, index+".left");
			res2 = estPresenteDansBloc(v, bloc.right, index+".right");
			if(res1===true) res = true;
			else res = false;
		break;
		
		case "ExpressionStatement":
			res1 = estPresenteDansBloc(v, bloc.expression, index+".expression");
			if(res1===true) res = true;
			else res = false;
		break;
		
		case "ForStatement" :
			var variables = new Array(v);
			instructions = parcourir(variables, bloc.body.body, index+".body.body");
			res = false;
		break;
		
		case "FunctionDeclaration":
			res1 = estPresenteDansBloc(v, bloc.id, index+".id");
			var variables = new Array(v);
			res2 = parcourir(variables, bloc.body.body, index+".body.body");
			if(res1===true) res = true;
			else res = false;
		break;
		
		case "FunctionExpression":
			var variables = new Array(v);
			instructions = parcourir(variables, bloc.body.body, index+".body.body");
			if(instructions.length == 0) 
				res = false;
			else
				res = true;
		break;
		
		case "Identifier":// arret de la recursion
			if (bloc.name===v) res = true;
			else res=false;
		break;
		
		case "IfStatement" :
			var variables = new Array(v);
			var instructions1 = parcourir(variables, bloc.consequent.body, index+".consequent.body"); 
			var instructions2 = parcourir(variables, bloc.alternate.body, index+".alternate.body");
			res = false;
		break;
		
		case "Literal": 	
			res=false;
		break;

		case "UpdateExpression":
			res1 = estPresenteDansBloc(v, bloc.argument, index+".argument");
			if(res1===true) res = true;
			else res = false;
		break;
		
		case "VariableDeclaration":
			for(var k=0;k<bloc.declarations.length;k++) {
				sbloc = bloc.declarations[k];
				if(sbloc.type==="VariableDeclarator") {
					res1 = estPresenteDansBloc(v, sbloc.id, index+".declarations["+k+"].id");
					if(res1===true) res = true;
					else res = false;
				}
			}
		break;
		
		case "WhileStatement":
			var variables = new Array(v);
			instructions = parcourir(variables, bloc.body.body, index+".body.body");
			res = false;
		break;
		
		default:
		break;
	}
	return res;
}
//-----------------------------------------------------------------------------------------------------------------------------
// Permet de chercher les différentes variables présentes dans une branche particulière
//-----------------------------------------------------------------------------------------------------------------------------
function chercherLesVariablesDansUnSeulBloc(variables, bloc, index) {
	compteur++;
	
	var sbloc = new Object();
	var variable = new String();
	var nvelles_variables = new Array();
	var res1 = new Array();
	var res2 = new Array();
	
	switch (bloc.type) {
		
		case "AssignmentExpression" :
			res1 = chercherLesVariablesDansUnSeulBloc(variables, bloc.left, index+".left");
			res2 = chercherLesVariablesDansUnSeulBloc(variables, bloc.right, index+".right");
			nvelles_variables = res1.concat(res2).unique();
		break;
		
		case "BinaryExpression":
			res1 = chercherLesVariablesDansUnSeulBloc(variables, bloc.left, index+".left");
			res2 = chercherLesVariablesDansUnSeulBloc(variables, bloc.right, index+".right");
			nvelles_variables = res1.concat(res2).unique();
		break;
		
		case "CallExpression":
			res1 = chercherLesVariablesDansUnSeulBloc(variables, bloc.callee, index+".callee");
			var arguments = new Array();
			var argument = new Object();
			arguments = bloc.arguments;
			for(var k = 0; k<arguments.length; k++) {
				argument = arguments[k];
				res2 = res2.concat(chercherLesVariablesDansUnSeulBloc(variables, argument, index+"."+argument)).unique();
			}
			nvelles_variables = res1.concat(res2).unique();
		break;	

		case "ExpressionStatement":
			sbloc = bloc.expression;
			nvelles_variables = chercherLesVariablesDansUnSeulBloc(variables, sbloc, index+".expression").unique();
		break;		
		
		case "ForStatement" :
			res1 = chercherLesVariablesDansUnSeulBloc(variables, bloc.body.body[0], index+".body.body.0");
			nvelles_variables = res1.unique();
		break;
		
		case "Identifier": // arret de la recursion
			variable=bloc.name;
			if(nvelles_variables.indexOf(variable)===-1) {
				nvelles_variables.push(variable);
			}
		break;
		
		case "IfStatement" :
			res1 = chercherLesVariablesDansUnSeulBloc(variables, bloc.consequent.body[0], index+".consequent.body.0");
			res2 = chercherLesVariablesDansUnSeulBloc(variables, bloc.alternate.body[0], index+".alternate.body.0");
			nvelles_variables = res1.concat(res2).unique();
		break;
		
		case "UpdateExpression":
			res1 = chercherLesVariablesDansUnSeulBloc(variables, bloc.argument, index+".argument");
			nvelles_variables = res1.unique();
		break;

		case "VariableDeclaration":
			for(var k=0;k<bloc.declarations.length;k++) {
				sbloc = bloc.declarations[k];
				if(sbloc.type==="VariableDeclarator") {
					res1 = chercherLesVariablesDansUnSeulBloc(variables, sbloc.id, index+".declarations["+k+"].id");
					if(sbloc.init != undefined)
						res2 = chercherLesVariablesDansUnSeulBloc(variables, sbloc.init, index+".declarations["+k+"].init");
					nvelles_variables = res1.concat(res2).unique();
				}
			}
		break;
		
		case "WhileStatement":
			res1 = chercherLesVariablesDansUnSeulBloc(variables, bloc.body.body[0], index, ".body.body.0");
			nvelles_variables = res1.unique();
		break;

		case "FunctionDeclaration":
		break;
		
		case "Literal":
		break;
		
		default:
		break;
	}
	return nvelles_variables;
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet de comparer les index entre eux afin d'obtenir les instructions
// dans le bon ordre lors de la génération du slice
//-----------------------------------------------------------------------------------------------------------------------------
function compare(a, b) {
	a = a.substr(1).split(".");
	b = b.substr(1).split(".");
  
	if(a.length == 0) {
		return -1;
	}
	else if(b.length == 0) {
		return 1;
	}
	if (isInf(a,b,0))
		return -1;
	else
		return 1;
}


// Renvoie "true" si a est inférieur à b au sens des index
function isInf(a, b, i) {
	
	while (i < Math.min(a.length, b.length)) {
		if (!isNaN(parseInt(a[i])) && !isNaN(parseInt(b[i]))) {
			if (parseInt(a[i]) < parseInt(b[i]) ) {
				return true;
			}
			else if (parseInt(a[i]) == parseInt(b[i])) {
				i++;
				return isInf(a,b,i);
			}
			else {
				return false;
			}
		}
		else if (isNaN(parseInt(a[i])) && isNaN(parseInt(b[i]))) {
		    if (a[i] == "consequent" && b[i] == "alternate")
				return true;
			else if(a[i] == "alternate" && b[i] == "consequent")
				return false;
			else {
				i++;
				return isInf(a,b,i);
			}
		}
	}
	return false;
}

//-----------------------------------------------------------------------------------------------------------------------------
// Gère l'affichage des résultats
//-----------------------------------------------------------------------------------------------------------------------------
function affichage(tab, corps) {
	if (tab.length == 0) {
		if (typeof editor2 !== 'undefined') 
			editor2.getDoc().setValue(editor2.getValue() + "\n// Variable non trouvée");
		else	
			write("<p style='text-align:center; font-style: italic'>Variable non trouvée</p>");
	}
	else {
		tab.sort(compare);
		var program = '';
		var inFunction = false;
		var inWhile = false;
		var inFor = false;
		
		for(var x=0; x<tab.length; x++) {
			var index = tab[x];
			var bloc = corps;
			index = index.substr(1);
			var index_arr = index.split(".");

			for ( var k = 0; k < index_arr.length; k++) {
					bloc = bloc[index_arr[k]];
			}
			if (index_arr[1] == "consequent") {
				program+="if (" + escodegen.generate(corps[index_arr[0]].test) + ") { \n" + escodegen.generate(corps[index_arr[0]].consequent.body[0]) + "\n}\n";
			}
			else if (index_arr[1] == "alternate") {
				program+="if (" + escodegen.generate(corps[index_arr[0]].test) + ") {} \nelse { \n" + escodegen.generate(corps[index_arr[0]].alternate.body[0]) + "\n}\n";
			}
			else if (index_arr[1] == "body") {			
				if (corps[index_arr[0]].type == "FunctionDeclaration") {
					if (inFor || inWhile) {
						inFor = false;
						inWhile = false;
						program+="}\n";
					}	
					if (inFunction == false) {
						var lg = corps[index_arr[0]].params.length;
						inFunction = true;
						program+="function " + corps[index_arr[0]].id.name + " (";
						if (lg == 0)
							program += " ) {\n";
						else {
							for (var i = 0; i < lg-1; i++)
								program += corps[index_arr[0]].params[i].name + ", "; 
							program += corps[index_arr[0]].params[lg-1].name + ") { \n";
						}
						program+=escodegen.generate(bloc)+"\n";
					}
					else {
						program+=escodegen.generate(bloc)+"\n";
					}
				}
				else if (corps[index_arr[0]].type == "WhileStatement") {
					if (inFor || inFunction) {
						inFor = false;
						inFunction = false;
						program+="}\n";
					}	
					if (inWhile == false) {
						inWhile = true;
						program+="while (" + escodegen.generate(corps[index_arr[0]].test) + ") { \n" +
						escodegen.generate(bloc)+"\n";
					}
					else {
						program+=escodegen.generate(bloc)+"\n";
					}
				}
				else if (corps[index_arr[0]].type == "ForStatement") {
					if (inWhile || inFunction) {
						inWhile = false;
						inFunction = false;
						program+="}\n";
					}	
					if (inFor == false) {
						inFor = true;
						program+="for (" + escodegen.generate(corps[index_arr[0]].test) + ") { \n" +
						escodegen.generate(bloc)+"\n";
					}
					else {
						program+=escodegen.generate(bloc)+"\n";
					}
				}
			}
			else {
				if (inFunction) {
					inFunction = false;
					program+="}\n";
				}	
				
				if (inFor) {
					inFor= false;
					program+="}\n";
				}	
				
				if (inWhile) {
					inWhile = false;
					program+="}\n";
				}	
				program+=escodegen.generate(bloc)+"\n";
			}
		}
		if (inFunction || inWhile || inFor) 
			program+="}\n";
		
		if (typeof editor2 !== 'undefined') {
			editor2.getDoc().setValue(editor2.getValue() + "\n" + program);
			indentAll(editor2);
		}
		else {
			var reg=new RegExp("(\n)", "g");
			program.replace(reg, "<br>");
			write(program);
		}
	}
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet d'initialiser le slicing du programme avec une variable donnée
//-----------------------------------------------------------------------------------------------------------------------------
function slicing(corps,myvar) {
		var variables = new Array(myvar);

		var index = new String();
		parcourir(variables, corps, index);
		
		if (typeof editor2 !== 'undefined')  {
			editor2.getDoc().setValue("// Slicing pour : " + myvar + "\n");
			affichage(tab, corps);
		}
		else {
			write("<h3>Slicing pour : <b>" + myvar + "</b></h3>");
			affichage(tab, corps);
		}
}

//-----------------------------------------------------------------------------------------------------------------------------
// Permet la détection des menaces éventuelles
// Compare le motif caractéristique d'un keylogger avec la structure hiérarchique du code
//-----------------------------------------------------------------------------------------------------------------------------
function match(data) {
	var corps = data.body;
	///////////////////////////////////////////////////////////////
	// 1) Détecter l'appel à un "fromCharCode"
	///////////////////////////////////////////////////////////////
	var index = new String();
	var test1 = new Array();
	test1 = getIndexes(corps, 'name', 'fromCharCode', index);
	if (test1.length != 0) {
		var myvar;
		var tab2 = new Array();
		// au cas où il y ait plusieurs "fromCharCode"
		for (var i = 0; i < test1.length; i++) {
			var arr = test1[i].split(".");
			var path = corps;
			// on commence à la case 1 car la case 0 est vide
			for (var j = 1; j < arr.length - 2; j++) {
				path = path[arr[j]];
			}
			path = path.arguments[0].name;
			myvar = path;
			
			write("<h2>Etape 1</h2><b>fromCharCode</b> appliqué à la variable <b>" + myvar + "</b>");
			write("<hr />");
			
			/////////////////////////////////////////////////////////////////////////////////
			// 2) Détecter l'utilisation d'un keyCode / charCode / which
			/////////////////////////////////////////////////////////////////////////////////
			write("<h2>Etape 2</h2>");
			slicing(corps, myvar);
			for (var k = 0; k < tab.length; k++) {
				var bool = false;
				var prop;
				var arr2 = tab[k].split(".");
				var index = new String();
				test2 = (getIndexes(corps[arr2[1]], 'name', 'keyCode', index).concat(getIndexes(arr2[1], 'name', 'charCode', index))).concat(getIndexes(arr2[1], 'name', 'which', index));
				if(test2.length != 0) {
					for (var l = 0; l < test2.length; l++) {
						var arr3 = test2[l].split(".");
						var path = corps[arr2[1]];
						// on commence à la case 1 car la case 0 est vide
						for (var m = 1; m < arr3.length - 1; m++) {
							path = path[arr3[m]];
						}
						prop = path.property.name;
						path = path.type;
						
						if (path == "MemberExpression")  {
							var bool = true;
						}
					}
				}
			}
			if (prop !== undefined)
				write("<b>" + prop + "</b> présent<hr />");
			else 
				write("<b>keyCode / charCode / which</b> non présents<hr /><hr />");
				
			if (bool == true)  {
				write("<h1>Keylogger détecté !</h1><hr /><hr />");
			}
			else {
				write("<h1>Faible probabilité de présence d'un keylogger</h1><hr /><hr />");
			}
			
		}
	}
	
	else {
		write("<h1>Pas de keylogger détecté</h1>");
	}
}


/*****************************************************/

function analyze() {
	tab.length=0;
	var output = document.getElementById("output");
	output.innerHTML = "";
	indentAll(editor);
	editor.getDoc().setValue(process());
	var code = editor.getValue();
	console.log(typeof code);
	var data = esprima.parse(code);
	write("<h1>Détection des menaces éventuelles</h1>");
	match(data);
}

function slice(myvar) {
	tab.length=0;
	var output = document.getElementById("output");
	output.innerHTML = "";
	myvar = myvar.trim();
	if (myvar.indexOf(' ') != -1)
		editor2.getDoc().setValue("// Nom de variable incorrect");
	else {
		var code = editor.getValue();
		indentAll(editor);
		console.log("code : " + code);
		var data = esprima.parse(code);
		var corps = data.body;
		slicing(corps, myvar);
	}
}

function ast() {
	var code = editor.getValue();
	indentAll(editor);
	console.log("type de code : " + typeof code);
	var data = jsl.format.formatJson(JSON.stringify(esprima.parse(code)));
	editor2.getDoc().setValue(data);
}
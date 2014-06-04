var compteur = 0;
var tab = new Array(); // tableau contenant les index des instructions 
var index_max = new String();


function write(text) {
	var output = document.getElementById("output");
	output.innerHTML += text + "<br>";
}
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
function index_abs2rel(index_abs) {
	return index_abs.substring((index_abs.lastIndexOf(".")+1));
}
//-----------------------------------------------------------------------------------------------------------------------------
function parcourir(variables, corps, index) {
	var myvar;
	var nvelles_instructions = new Array();
	var instructions = new Array();
	
	for(var k=0; k<variables.length ; k++) {
		myvar=variables[k];
		nvelles_instructions=chercheUneVariableDansPlusieursBlocs(myvar, corps, instructions, index); // donne les blocs de corps où se trouve "myvar" et place leurs indices dans "instructions"
		
		if (nvelles_instructions!==null) {
			variables=variables.concat(chercherLesVariablesDansPlusieursBlocs(corps, nvelles_instructions,variables, index)).unique(); // donne les variables qui se trouvent dans les blocs que l'on n'a pas encore fouillés
		}
	}
	
	tab = tab.concat(instructions);
	return instructions;
}
//-----------------------------------------------------------------------------------------------------------------------------
function chercheUneVariableDansPlusieursBlocs(myvar, corps, instructions, index) {
	var nvelles_instructions = new Array();
	for(var k=0 ; k<corps.length ; k++) { // éliminer les indices dans "instructions"
		if(instructions.indexOf(k)===-1) { // on a pas encore fouillé dans ce bloc
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
			res1 = estPresenteDansBloc(v, bloc.body.body[0], index+".body.body.0");
			if(res1===true) res = true;
			else res = false;
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
			res1 = parcourir(variables, bloc.body.body, index+".body.body");
			res = false;
		break;
		
		case "Identifier":// arret de la recursion
			if (bloc.name===v) res = true;
			else res=false;
		break;
		
		case "IfStatement" :
			var variables = new Array(v);
			var instructions1 = parcourir(variables, bloc.consequent.body, index+".consequent.body"); 
			var instructions2 = parcourir(variables, bloc.alternate.body, index+".alternate.body");
	
			if( instructions1.length === 0 ) {
				res1 = false;
			}
			else {
				res1 = true;
			}
			
			if( instructions2.length === 0 ) {
				res2 = false;
			}
			else {
				res2 = true;
			}
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
			res1 = estPresenteDansBloc(v, bloc.body.body[0], index+".body.body.0");
			if(res1===true) res = true;
			else res = false;
		break;
		
		default:
		break;
	}
	return res;
}
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
function compare(a, b) {
	a = a.split(".");
	b = b.split(".");
  return a[1] - b[1];
}

//-----------------------------------------------------------------------------------------------------------------------------

function affichage(tab, corps) {
	tab.sort(compare);
	var body = false;
	for(var x=0; x<tab.length; x++) {
		var index = tab[x];
		var bloc = corps;
		index = index.substr(1);
		var index_arr = index.split(".");
		for ( var k = 0; k < index_arr.length; k++) {
				bloc = bloc[index_arr[k]];
		}
		if (index_arr[1] == "consequent") {
			if (body == true)
				write("}");
			write("if (" + escodegen.generate(corps[index_arr[0]].test) + ") { <br/>" + escodegen.generate(corps[index_arr[0]].consequent.body[0]) + "<br />}");
		}
		else if (index_arr[1] == "alternate") {
			if (body == true)
				write("}");
			write("if (" + escodegen.generate(corps[index_arr[0]].test) + ") {} <br /> else { <br/>" + escodegen.generate(corps[index_arr[0]].alternate.body[0]) + "<br />}");
		}
		else if (index_arr[1] == "body") {
			if (body == false) {
				body = true;
				write("function " + corps[index_arr[0]].id.name +
				" (" + corps[index_arr[0]].params[0].name + ") { <br/>" +
				escodegen.generate(bloc));
			}
			else {
			if (body == true)
				write(escodegen.generate(bloc));
			}
		}
		else {
			if (body == true)
				write("}");
			write(escodegen.generate(bloc));
		}
	}
	if (body == true) 
		write("}");
}
//-----------------------------------------------------------------------------------------------------------------------------

function slicing(corps,myvar) {
		var variables = new Array(myvar);
		write("<h3>Slicing pour : <b>" + myvar + "</b></h3>");

		var index = new String();	
		parcourir(variables, corps, index);
		affichage(tab, corps);
}


// Renvoie "true" si a est inférieur à b au sens des index
function isInf(a, b) {
	a = a.split(".");
	b = b.split(".");

	if (parseInt(a[1]) <= parseInt(b[1]) ) {
		return true;
	}
	else if(a.length <= 1) {
		return false;
	}
	else {
		return false;
	}
}


function rechercherUnObjet(bloc, obj, index) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
		
			if (JSON.stringify(obj[i]) == JSON.stringify(bloc)) { 
				objects.push(index + "." + i);
			}
			else {
				objects = objects.concat(rechercherUnObjet(bloc, obj[i], index+"."+i));   
			}
		}
    }
    return objects;
}

function rechercherUneInstruction (instruction, corps, index) {
	// on convertit l'instruction en bloc via Esprima
	// le "body[0]" vient du fait que cette instruction est interprétée comme un programme entier
	// var bloc = JSON.stringify(esprima.parse(instruction), null, 4);
	var bloc = esprima.parse(instruction).body[0];
	var res = rechercherUnObjet(bloc, corps, index);
	// on considère uniquement la première occurrence de l'instruction (res[0])
	// On récupère l'index correspondant à l'instruction
	return res[0];
}

function slice(myvar) {
	tab.length=0;
	var output = document.getElementById("output");
	output.innerHTML = "";
	var code = editor.getValue();
	indentAll(editor);
	console.log("code : " + code);
	var data = esprima.parse(code);
	var corps = data.body;
	slicing(corps, myvar);
}

function indentAll(cm) { 
  var last = cm.lineCount(); 
  cm.operation(function() { 
    for (var i = 0; i < last; ++i) cm.indentLine(i); 
  }); 
} 
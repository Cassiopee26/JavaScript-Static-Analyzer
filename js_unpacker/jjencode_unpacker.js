var JJEncode = {

	detect: function(text) {
		
		var gvcatch=text.substring((text.indexOf("~[]")), text.lastIndexOf('"\\"")())()')); //récupération d'un texte contenant notre variable globale car débutant au caractère ~[]
		var gv=gvcatch.substring((gvcatch.indexOf("]")+2),gvcatch.indexOf("=")); //récupération de la variable globale qui est située entre ~[]; et le prochain ";"
		if(gv.length==0){
			return false;
		}
		return true;
	},
	
	
	unpack: function(t)
	{
		var gv;
		var	gvl;	
				
		gvcatch=t.substring((t.indexOf("~[]")), t.lastIndexOf('"\\"")())()'));
		gv=gvcatch.substring((gvcatch.indexOf("]")+2),gvcatch.indexOf("="));
		
		gvl	= gv.length;
			
		
		var jjencodePreamble= gv + "=~[]";
		var evalPreamble= gv+".$("+gv+".$(";
		var decodePreamble="("+gv+".$(";
		var evalPostamble=")())()";
		var decodePostamble=") ());";

		var part1 = t.slice(0,t.lastIndexOf(jjencodePreamble));//partie de code avant le jjencode
		var part2 = t.slice(t.lastIndexOf(jjencodePreamble),t.lastIndexOf(evalPreamble));//partie du jjencode contenant la création de l'alphabet
		var part3 = t.slice(t.lastIndexOf(evalPreamble),t.lastIndexOf(evalPostamble)+evalPostamble.length);//partie du jjencode contenant le eval()
		var part4 = t.slice(t.lastIndexOf(evalPostamble)+evalPostamble.length+1, t.length);//partie de code après le jjencode
        
		
		var part2bis = part2.replace(evalPreamble, decodePreamble)
                                 .replace(evalPostamble, decodePostamble);// on ne modifie que le dernier jjencode détecté
		var part3bis = part3.replace(evalPreamble, decodePreamble)
                                 .replace(evalPostamble, decodePostamble);// on ne modifie que le dernier jjencode détecté
		
		return part1+eval(part2bis+part3bis)+part4;
	}	
}
var AAEncode = {
	detect: function (text) {
        var evalPreamble = "(\uFF9F\u0414\uFF9F) ['_'] ( (\uFF9F\u0414\uFF9F) ['_'] (";
        var evalPostamble = ") (\uFF9F\u0398\uFF9F)) ('_');";
		 if (text.lastIndexOf(evalPreamble) < 0 || text.lastIndexOf(evalPostamble) < 0 /*text.lastIndexOf(evalPostamble) != text.length - evalPostamble.length*/) {
			return false;
        }
		return true;
	},
	
    unpack: function(text) {
		var aaencodePreamble = "\uFF9F\u03C9\uFF9F\uFF89\u003D\u0020\u002F\uFF40\uFF4D\u00B4\uFF09"     //ﾟωﾟﾉ= /｀ｍ´）
        var evalPreamble = "(\uFF9F\u0414\uFF9F) ['_'] ( (\uFF9F\u0414\uFF9F) ['_'] (";
        var decodePreamble = "( (\uFF9F\u0414\uFF9F) ['_'] (";
        var evalPostamble = ") (\uFF9F\u0398\uFF9F)) ('_');";
        var decodePostamble = ") ());";

        // strip beginning/ending space.
        text = text.replace(/^\s*/, "").replace(/\s*$/, "");

        // returns empty text for empty input.
        if (/^\s*$/.test(text)) {
            return "";
        }
        // check if it is encoded.
        // if (text.lastIndexOf(evalPreamble) < 0) {
            // throw new Error("Given code is not encoded as aaencode.");
        // }
        // if (text.lastIndexOf(evalPostamble) != text.length - evalPostamble.length) {
            // throw new Error("Given code is not encoded as aaencode.");
        // }

        //var decodingScript = text.replace(evalPreamble, decodePreamble)
        //                         .replace(evalPostamble, decodePostamble);
		//console.log(decodingScript); 
		var part1 = text.slice(0,text.lastIndexOf(aaencodePreamble));//partie de code avant le aaencode
		var part2 = text.slice(text.lastIndexOf(aaencodePreamble),text.lastIndexOf(evalPreamble));//partie du aaencode contenant la création de l'alphabet
		var part3 = text.slice(text.lastIndexOf(evalPreamble),text.lastIndexOf(evalPostamble)+evalPostamble.length);//partie du aaencode contenant le eval()
		var part4 = text.slice(text.lastIndexOf(evalPostamble)+evalPostamble.length+1, text.length);//partie de code après le aaencode
        
		
		var part2bis = part2.replace(evalPreamble, decodePreamble)
                                 .replace(evalPostamble, decodePostamble);// on ne modifie que le dernier aaencode détecté
		var part3bis = part3.replace(evalPreamble, decodePreamble)
                                 .replace(evalPostamble, decodePostamble);// on ne modifie que le dernier aaencode détecté
		//console.log("PART 1 "+ part1);
        //console.log("PART 2 "+ part2);
        //console.log(" PART 3 "+ part3);
		//console.log(" PART 4 " + part4);
		return part1+eval(part2bis+part3bis)+part4;
    },
    doDecode: function() {
        var oEncoded = document.getElementById("AAEncode_encoded");
        var oDecoded = document.getElementById("AAEncode_decoded");

        try {
            oDecoded.value = AAEncode.unpack(oEncoded.value);
        } catch (ex) {
            oDecoded.value = "****Error:\n" + ex.toString();
        }
    },
    dummy: null
};
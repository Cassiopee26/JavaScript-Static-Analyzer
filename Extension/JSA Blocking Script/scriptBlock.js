/* 
    NotScripts
    Copyright (C) 2010  Eric Wong       
        contact@optimalcycling.com
        http://www.optimalcycling.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


//---------------------------------------------------------------------------------------

/*
	Cette partie du code, récupérée de l'extension NotScript, n'est pas tout à fait au point. Elle ne bloque pas
	encore tous les scripts.
*/

//----------------------------------------------------------------------------------------------------

chrome.storage.local.get(null, function(items) {

	console.log("scriptBlock content script loaded in web page");
	//alert("blocking : " + document.URL);
	// console.log("URL in code.js : " + document.URL); // TEST
	// console.log("ITEMS in code.js : "); // TEST
	// console.dir(items); // TEST
	// console.dir(items.url); // TEST

	if(items.url === document.URL) {
		// alert("blocking" + document.URL);
		document.addEventListener("beforeload", blockScripts, true);
		mitigateInlineScripts();
	}
});


// ------------------------------------------------------------------------------------------------------------

const EL_TYPE = {
  "OTHER": 0,
  "SCRIPT": 1,
  "OBJECT": 2,
  "EMBED": 3,
  "IFRAME": 4,
  "FRAME": 5,
  
  /*
  "AUDIO": 6,
  "VIDEO": 7,
  "IMG": 8,
  "BODY": 9,
  "CSS": 10
  */
};

var topDomain = window.location.href;

//---------------------------------------------------------------------------------------------------------------------------------------

function getElType(el) {
		// Note: We cannot block java that uses the deprecated APPLET tags because it doesn't fire beforeload
		//console.log("nodeName: " + el.nodeName);
		switch (el.nodeName.toUpperCase()) 
		{
				case 'SCRIPT': return EL_TYPE.SCRIPT;
				case 'OBJECT': return EL_TYPE.OBJECT;
				case 'EMBED': return EL_TYPE.EMBED;
				case 'IFRAME': return EL_TYPE.IFRAME;
				case 'FRAME': return EL_TYPE.FRAME;
				
				/*
				case 'AUDIO': return EL_TYPE.AUDIO;
				case 'VIDEO': return EL_TYPE.VIDEO;
				case 'IMG': return EL_TYPE.IMG;
				case 'LINK': return EL_TYPE.CSS;
				case 'BODY': return EL_TYPE.BODY;
				*/
				default: return EL_TYPE.OTHER;
		}
}

// ----------------------------------------------------------------------------------------------------------------------

function getElUrl(el, type) {
		//console.log("getElUrl: " + el.nodeName + "	 " +  el.outerHTML);
		switch (type) 
		{
				case EL_TYPE.SCRIPT: 
				{
						return el.src;
				}
				case EL_TYPE.EMBED:
				{
						// Does Google Chrome even use embeds?
						var codeBase = window.location.href;
						if (el.codeBase) codeBase = el.codeBase;
						
						if (el.src)
						{
								if (reStartWProtocol.test(el.src))
										return el.src;
								else
										return codeBase;
						}
						
						if (el.data)
						{
								if (reStartWProtocol.test(el.data))
										return el.data;
								else
										return codeBase;								
						}
						
						if (el.code)
						{
								if (reStartWProtocol.test(el.code))
										return el.code;
								else
										return codeBase;						
						}
						
						return window.location.href;
				}
				case EL_TYPE.IFRAME: 
				{
						return el.src;
				}
				case EL_TYPE.FRAME: 
				{
						return el.src;
				}				
				case EL_TYPE.OBJECT:
				{
						var codeBase = window.location.href;
						if (el.codeBase) codeBase = el.codeBase;		
						
						// If the data attribute is given, we know the source.
						if (el.data)
						{
								if (reStartWProtocol.test(el.data))
										return el.data;
								else
										return codeBase;								
						}
						
						var plist = el.getElementsByTagName('param');
						var codeSrc = null;
						for(var i=0; i < plist.length; i++){
								var paramName = plist[i].name.toLowerCase();
								
								//console.log("Looking at param: " + plist[i].name + "	  " + plist[i].value);
								
								if(paramName === 'movie' || paramName === 'src' || paramName === 'codebase' || paramName === 'data')
										return plist[i].value;
								else if (paramName === 'code' || paramName === 'url')
										codeSrc = plist[i].value;
						}
						
						if (codeSrc)
								return codeSrc;
						else
								return window.location.href;
				}
				
				/*
				case EL_TYPE.AUDIO:
				{
						return window.location.href;
						
						// We won't get a el.src if AUDIO uses the <source> tag
						//return el.src;
				}
				case EL_TYPE.VIDEO:
				{
						return window.location.href;
						// We won't get a el.src if VIDEO uses the <source> tag
						//return el.src;
				}				
				case EL_TYPE.IMG:
				{
						return el.src;
				}
				case EL_TYPE.CSS:
				{
						return el.href;
				}
				case EL_TYPE.BODY:
				{
						var bgImage = getComputedStyle(el,'').getPropertyValue('background-image');
						if (bgImage && bgImage !== "none") return bgImage.replace(/"/g,"").replace(/url\(|\)$/ig, "");
						else return null;
				}
				*/
				default: return (el.src ? el.src : null);
		}
}

// --------------------------------------------------------------------------------------------------------------------------------


function preventAndAddToList(event, mainURL)
{	
	// console.log(event); // TEST
	event.preventDefault();
   
}

//------------------------------------------------------------------------------------------------------------------------------------------

function blockScripts(event) {
		// alert("blockScripts");
		var el = event.target;
		
		var elType = getElType(el);
		var currUrl = relativeToAbsoluteUrl(getElUrl(el, elType));
		
		// console.log("el Type : " + el + "	" + elType + "	" + currUrl); // TEST
	
		if ((elType === EL_TYPE.IFRAME) ||
			(elType === EL_TYPE.FRAME) ||
			(elType === EL_TYPE.EMBED) || 
			(elType === EL_TYPE.OBJECT) || 
			(elType === EL_TYPE.SCRIPT)
		){						 
			// console.log("Before " + currUrl); // TEST
			var mainURL = getPrimaryDomain((elType === EL_TYPE.IFRAME || elType === EL_TYPE.FRAME) ? window.location.href : currUrl);
			// console.log("After " + "   " + mainURL); // TEST					 
			preventAndAddToList(event, mainURL);   
		}
}

// -------------------------------------------------------------------------------------------------------------


function injectAnon(f) {
	var script = document.createElement("script");
		//script.type = "text/javascript";
	script.textContent = "(" + f + ")();";
	document.documentElement.appendChild(script);
}

// ---------------------------------------------------------------------------------------------------------

function mitigateAndAddToList(mainURL)
{
	injectAnon(function(){
		for (var i in window)
		{
			try {
				var jsType = typeof window[i];
				switch (jsType.toUpperCase())
				{										
					case "FUNCTION": 
						if (window[i] !== window.location)
						{
							if (window[i] === window.open || (window.showModelessDialog && window[i] === window.showModelessDialog))
								window[i] = function(){return true;};
							else if (window[i] === window.onbeforeunload)	// To try to fix onbeforeunload pop ups some users report seeing but I can't replicate.
								window.onbeforeunload = null;
							else if (window[i] === window.onunload)
								window.onunload = null;															
							else
								window[i] = function(){return "";};
						}
					break;													
				}						
			}
			catch(err)
			{}				
		}
		
		for (var i in document)
		{
			try {
				var jsType = typeof document[i];
				switch (jsType.toUpperCase())
				{										
					case "FUNCTION":
						document[i] = function(){return "";};
					break;									
				}						
			}
			catch(err)
			{}				
		}

		try {
			eval = function(){return "";};							
			unescape = function(){return "";};
			String = function(){return "";};
			parseInt = function(){return "";};
			parseFloat = function(){return "";};
			Number = function(){return "";};
			isNaN = function(){return "";};
			isFinite = function(){return "";};
			escape = function(){return "";};
			encodeURIComponent = function(){return "";};
			encodeURI = function(){return "";};
			decodeURIComponent = function(){return "";};
			decodeURI = function(){return "";};
			Array = function(){return "";};
			Boolean = function(){return "";};
			Date = function(){return "";};
			Math = function(){return "";};
			Number = function(){return "";};
			RegExp = function(){return "";};
			
			var oNav = navigator;
			navigator = function(){return "";};
			oNav = null;					
		}
		catch(err)
		{}
		
	}); 
}

//----------------------------------------------------------------------------------------------------------------

function mitigateInlineScripts() {
	// alert("mitigate");
	mitigateAndAddToList(topDomain);	   
}

//------------------------------------------------------------------------------------------------------------------------------------------------

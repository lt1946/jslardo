/**
 * jslardo - a social cms based on node.js
 *
 *
 * Copyright (C) 2011 Federico Carrara (federico@obliquid.it)
 *
 * For more information http://obliquid.org/
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */



// VARS

/*
questa var viene impostata da jslardo.js appena dopo il require di utils.js
 
in generale app viene passato come parametro alle functions di utils e di tutti
i moduli di jslardo.
nel caso però si vogliano usare queste function come helper nelle view dei siti
degli utenti, la variabile app non è definita e non può essere passata alle view
per motivi di sicurezza. quindi per questi casi serve app definita come variabile
interna di utils.
*/
var app;





	



// VARIE




/* visualizza una pagina di errore e logga sulla console */
function errorPage(res, errMsg, publicMsg, useLayout) {
	if ( useLayout === undefined ) useLayout = true;
	console.log(errMsg);
	res.render('error', {
		layout: useLayout,
		errMsg: errMsg,
		publicMsg: publicMsg
	});			
}
exports.errorPage = errorPage; 


/*
questa serve quando mi arriva da un form l'oggetto req.body con tutti i campi del form, e devo salvarli nell'oggetto mongoose.
per non dover scrivere condice embedded (un assegnamento per ogni campo del form), c'è questo metodo che loopa su tutti i campi che arrivano dal form
e li salva pari pari nell'oggetto che andrà nel db.
*/
function populateModel(model, modelData) {
	//questa va lasciata così, e poi ne va creata un'altra populateContentModel che
	//fa un matching delle property da popolare direttamente sullo schema del mio model
	/*
	console.log('############### populateModel');
	console.log('model:');
	console.log(model);
	console.log('modelData:');
	console.log(modelData);
	*/
	//if(modelData.hasOwnProperty('titolo') && typeof modelData['titolo'] !== 'function') {
	
	
	
	//ciclo su tutte le property che mi arrivano in modelData (le dovrò replicare in model)
	for(var prop in modelData) {
		if(modelData.hasOwnProperty(prop) && typeof modelData[prop] !== 'function')
		{
			//assegno a model la mia property, ma solo se non si tratta dell'id
			if( prop != "id" )
			{
				/*
				console.log('### considero la prop: '+prop+' ###');
				console.log('typeof modelData[prop]='+typeof modelData[prop]);
				console.log('typeof model[prop]='+typeof model[prop]);
				console.log('modelData[prop]='+modelData[prop]);
				console.log('model[prop]='+model[prop]);
				*/
				//porcheria per gestire i valori boolean
				//il form tratta tutto come string mentre lo schema mongoose è tipizzato
				//quandi un 'false' che arriva da un form diventerebbe un true nel db in quanto stringa non vuota castata a boolean
				if ( modelData[prop] == 'sure_this_is_true' ) {
					model[prop] = true;
				} else if ( modelData[prop] == 'sure_this_is_false' ) {
					model[prop] = false;
				} else {
					model[prop] = modelData[prop];
				}
			}
		}
	}
	/*
	console.log('############### populateModel alla fine');
	console.log('model:');
	console.log(model);
	console.log('modelData:');
	console.log(modelData);
	*/
}
exports.populateModel = populateModel;

function trunc(string,length) {
	if ( string && string.length > length ) {
		return string.substr(0,length)+'...';
	} else {
		return string;
	}
}
exports.trunc = trunc; 

var is_array = function (value) {
	//versione easy: return value && typeof value === 'object' && value.constructor === Array;
	return Object.prototype.toString.apply(value) === '[object Array]'; //questo va anche per array definiti in altre windows o frame
};
exports.is_array = is_array; 

var in_array = function (arr,obj) {
    return (arr.indexOf(obj) != -1);
}
exports.in_array = in_array; 

var splice_by_element = function (my_array,array_element) {
	for(var i=0; i<my_array.length;i++ ) { 
		if ( my_array[i] == array_element ) {
			my_array.splice(i,1); 
		}
	}
	return my_array;
}
exports.splice_by_element = splice_by_element; 

/* removes an element from an array by content */
Array.prototype.remove= function(){
    var what, a= arguments, L= a.length, ax;
    while(L && this.length){
        what= a[--L];
        while((ax= this.indexOf(what))!= -1){
            this.splice(ax, 1);
        }
    }
    return this;
}

/* says if an object is empty, i.e.: obj = {} */
function is_empty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}
exports.is_empty = is_empty;

/*
quando si ha un valore booleano che non si sa se è di tipo booleano
o di tipo stringa (cioè un booleano convertito in stringa 'true' o 'false')
questa function la ritrasforma in booleano
*/
var bool_parse = function (my_bool_string) {
	if ( !my_bool_string || my_bool_string == 'false' ) {
		return false;
	} else {
		return true;
	}
}
exports.bool_parse = bool_parse; 

/*
converte le date che arrivano da mongodb in date compatibili con il datepicker usato nel frontend
*/
var mongo_to_datepicker = function(mongoDate) {
	//console.log(mongoDate);
	var jsDate = new Date(mongoDate);
	var d = zeroPad(jsDate.getDate(),2);
	var m = zeroPad(jsDate.getMonth()+1,2);
	var y = jsDate.getFullYear();
	var h = zeroPad(jsDate.getHours(),2);
	var mn = zeroPad(jsDate.getMinutes(),2);
	var s = zeroPad(jsDate.getSeconds(),2);
	var pickerDate = y+'-'+m+'-'+d+'T'+h+':'+mn+':'+s;
	//console.log(pickerDate);
	return pickerDate;
}
exports.mongo_to_datepicker = mongo_to_datepicker; 

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}
exports.zeroPad = zeroPad; 

/* dato un modelId e un contentId, ritorna il path in cui salvare i relativi file uploadati */
function getContentPath(modelId,contentId) {
	//console.log('getContentPath:');
	modelId = modelId.toString();
	contentId = contentId.toString();
	//console.log(modelId);
	//console.log(contentId);
	var path = '';
	path += 'files/model/';
	for(var i=0; i<String(modelId).length; i++) {
		path += modelId.charAt(i)+'/';
	}
	path += 'content/';
	for(i=0; i<String(contentId).length; i++) {
		path += contentId.charAt(i)+'/';
	}
	return path;
}
exports.getContentPath = getContentPath; 

/*
crea tutte le directory che compongono un path
in input si aspetta un path assoluto sul filesystem in cui gira l'application (inizia con /)
*/
function mkPath(path) {
	console.log('mkPath con path:' + path);
	var fs = require('fs');
	var createdPath = '';
	var dirs = path.split('/');
	while ( dirs.length > 0 ) {
		var dir = dirs.shift();
		if (dir != '') {
			createdPath += '/'+dir;
			//controllo se esiste già
			try
			{
				var stats = fs.lstatSync(createdPath);
				console.log('la dir to esiste già');
			}
			catch (e)
			{
				console.log('la dir to non esiste');
				console.log('creo dir: '+createdPath);
				fs.mkdirSync(createdPath, 0775);
				console.log('creato dir: '+createdPath);
			}
		}
	}
}

/*
camuffa un poco un'email contro gli spammer
*/
function emailObfuscate(email) {
	return email.replace("@", " - at - ");
}
exports.emailObfuscate = emailObfuscate;

/*
renderizza una stringa json come literal leggibile
ovvero mette tab e mandate a capo
*/
function renderJson(jsonString,tabString) {
	if (!jsonString) return '';
	if ( !tabString ) tabString = '&nbsp;&nbsp;';
	var recursionCount = 0;
	return recurse(JSON.parse(jsonString));
	function recurse(jsonObj) {
		var rowPrefix = '';
		for ( var i=0; i<recursionCount; i++ ) {
			rowPrefix += tabString;
		}
		var output = '{';
		var isFirst = true;
		for (var property in jsonObj) {
			if ( jsonObj.hasOwnProperty(property) && typeof jsonObj[property] !== 'function') {
				if (!isFirst) {
					output += ',';
				}
				isFirst = false;
				output += '\n'+rowPrefix+tabString;
				//butto fuori il nome della property
				output += '"'+property+'": ';
				//se la mia property è un object, devo ricorrere
				if ( typeof jsonObj[property] === 'object' && !is_array(jsonObj[property]) ) {
					recursionCount++;
					output += recurse(jsonObj[property]);
					recursionCount--;
				} else if ( is_array(jsonObj[property]) ) {
					output += '[';
					for ( i=0; i<jsonObj[property].length; i++ ) {
						if (i>0) output += ',';
						output += '"'+jsonObj[property][i]+'"';
					}
					output += ']';
				} else {
					output += '"'+jsonObj[property]+'"';
				}
			}
		}
		return output+'\n'+rowPrefix+'}';
	}
}
exports.renderJson = renderJson;

/*
è un helper da usare direttamente nei tpl jade.
data un'immagine da visualizzare (completa di file_name e file_path) e una risoluzione
crea l'immagine ridimensionata se già non esiste, e ne ritorna l'url.
essendo usata nei tpl, viene eseguita prima che il tpl arrivi all'utente,
che nel browser riceve sempre un url esplicito, e non l'url di uno script
*/
function getImg(image,width,height,cssClasses,domId) {
	//se invece di una singola immagine mi arriva un array, tengo la prima
	if (is_array(image)) image = image[0];
	
	var path = image.file_path;
	var name = image.file_name;
	if ( !domId ) domId = '';
	if ( !cssClasses ) cssClasses = '';
	if ( !width ) width = 0;
	if ( !height ) height = 0;
	//costruisco l'url dell'immagine ridimensionata
	var resizedName = 'size'+width+'x'+height+'_'+name;
	var url = process.cwd()+'/public/'+path+name;
	var resizedUrl = process.cwd()+'/public/'+path+resizedName;
	console.log('getImg()');
	//console.log('image:');
	//console.log(image);
	console.log('url:');
	console.log(url);
	console.log('resizedUrl:');
	console.log(resizedUrl);
	
	//considero i casi su width ed height = 0
	if ( width == 0 && height == 0 ) {
		//devo restituire l'immagine originale
		return "<img id='"+domId+"' class='"+cssClasses+"' src='/"+path+name+"'/>";
	}
	
	//controllo se esiste già l'immagine ridimensionata
	try
	{
		var fs = require('fs');
		var stats = fs.lstatSync(resizedUrl);
		console.log('resized esiste già');
		//ritorno l'immagine già esistente
		//ritorno l'url, con uno slash davanti, altrimenti non funzia
		return "<img id='"+domId+"' class='"+cssClasses+"' src='/"+path+resizedName+"'/>";
	}
	catch (e)
	{
		console.log('resized NON esiste, va creata');
		console.log('width:');
		console.log(width);
		console.log('height:');
		console.log(height);
		var im = require('imagemagick');
		//distinguo i casi di width o height = 0
		if ( width == 0 ) {
			console.log('fisso height');
			//prima trovo le specs dell'immagine
			im.identify(url, function(err, features){
				if (err) throw err;
				console.log(features);
				// { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
				//trovo width in funzione di height
				width = height*features.width/features.height;
				im.resize({
					srcPath: url,
					dstPath: resizedUrl,
					'width':   width,
					'height':   height,
					quality: 0.9,
					//format: 'jpg',
					//progressive: false,
					strip: false,
					//filter: 'Lagrange',
					sharpening: 0.2
					//customArgs: []			
				}, function(err, stdout, stderr){
					if (err) throw err;
				});
			});
			//ritorno l'url, con uno slash davanti, altrimenti non funzia
			//ritorno l'url originario perchè la cache sta venendo generata e non è ancora disponibile
			return "<img id='"+domId+"' class='"+cssClasses+"' src='/"+path+name+"' style='height:"+height+"px;'/>";
		} else if ( height == 0 ) {
			console.log('fisso width');
			//prima trovo le specs dell'immagine
			im.identify(url, function(err, features){
				if (err) throw err;
				console.log(features);
				// { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
				//trovo height in funzione di width
				height = width*features.height/features.width;
				im.resize({
					srcPath: url,
					dstPath: resizedUrl,
					'width':   width,
					'height':   height,
					quality: 0.9,
					strip: false,
					sharpening: 0.2
				}, function(err, stdout, stderr){
					if (err) throw err;
				});
			});
			//ritorno l'url, con uno slash davanti, altrimenti non funzia
			//ritorno l'url originario perchè la cache sta venendo generata e non è ancora disponibile
			return "<img id='"+domId+"' class='"+cssClasses+"' src='/"+path+name+"' style='width:"+width+"px;'/>";
		} else {
			console.log('croppo');
			//prima trovo le specs dell'immagine
			im.identify(url, function(err, features){
				if (err) throw err;
				console.log(features);
				// { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
				im.crop({
					srcPath: url,
					dstPath: resizedUrl,
					'width': width,
					'height': height,
					quality: 0.9,
					sharpening: 0.2
				}, function(err, stdout, stderr){
					if (err) throw err;
				});
			});
			//ritorno l'url, con uno slash davanti, altrimenti non funzia
			//ritorno l'url originario perchè la cache sta venendo generata e non è ancora disponibile
			return "<img id='"+domId+"' class='"+cssClasses+"' src='/"+path+name+"' style='width:"+width+"px;height:"+height+"px;'/>";
		}
	}
}
exports.getImg = getImg;

/*
questa serve quando mi arriva un'istanza di un content, e devo popolarla per poterla salvare nell'istanza mongoose di un element.
si basa sullo schema del model mongoose, e in base a quello popola solo i fields necessari
*/
function populateContentModel(app, req, res, content, contentData, contentFiles, next) {
	/*
	console.log('###### populateContentModel:');
	console.log('content:');
	console.log(content);
	console.log('contentData:');
	console.log(contentData);
	*/
	
	//trovo il modelId (dipende se mi passano un content con il field jslModel già popolato o meno)
	if ( content.jslModel._id ) {
		var modelId = content.jslModel._id;
	} else {
		var modelId = content.jslModel;
	}
	
	//leggo dal db il mio model, per avere lo schema
	app.jsl.jslModel.findOne( { '_id': modelId } )
	.run( function(err, jslModel) {
		if (!err)
		{
			if ( jslModel ) {
				//trovato lo schema
				var schema = JSON.parse(jslModel.jslSchema);
				/*
				console.log('trovato lo schema!');
				console.log(schema);
				*/
				//ciclo su ogni field, e popolo solo quelli nel content
				for(var field in schema) {
					//non devo mai popolare alcuni field interni di jslardo, perchè non vengono gestiti dal form
					if ( field == 'author' || field == 'created' ) {
						//skippo
					} else {
						/*
						console.log('### considero il field: '+field);
						console.log('content[field]: '+content[field]);
						console.log('contentData[field]: '+contentData[field]);
						*/
						//prima distinguo a seconda che sia un field array o a valore singolo
						if ( is_array( schema[field] ) ) {
							//è un array, per ora gestisco solo valori separati da virgola, perchè mi aspetto solo degli ObjectIds
							//console.log(field+' è un array!');
							if ( contentData[field] ) {
								content[field] = contentData[field].split(',');
							} else {
								//content[field] = null;
								delete content[field]; //tanto non serve a un cazzo perchè mongodb non resetta il field
							}
							/*
							//per ogni ObjectId devo istanziare la relativa istanza, e aggiungerla al mio content
							var ObjectIds = contentData[field].split(',');
							for ( var i = 0; i < ObjectIds.length; i++ ) {
								content[field].push( ObjectIds[i] );
							}
							*/
						} else {
							//non è un array, fisso il suo valore
							//console.log(field+' è un single!');
							//distinguo a seconda del datatype
							switch ( schema[field].type ) {
								case 'ObjectId':
									//nel caso degli ObjectId non assegno un field se non ha l'ObjectId definito
									if ( contentData[field] ) {
										content[field] = contentData[field];
									} else {
										//content[field] = null;
										delete content[field]; //tanto non serve a un cazzo perchè mongodb non resetta il field
									}
									break;
								case 'Boolean':
									//porcheria per gestire i valori boolean
									//il form tratta tutto come string mentre lo schema mongoose è tipizzato
									//quandi un 'false' che arriva da un form diventerebbe un true nel db in quanto stringa non vuota castata a boolean
									if ( contentData[field] == 'sure_this_is_true' ) {
										content[field] = true;
									} else if ( contentData[field] == 'sure_this_is_false' ) {
										content[field] = false;
									} else {
										content[field] = contentData[field];
									}
									break;
								case 'Image':
									//console.log('tinculo!');
									/*
									(se nessun file è stato uploadto, è tutto uguale, tranne size:0, name:'', lastModifiedDate:null )
									contentFiles:
									{ foto: 
										{ 	size: 760,
											path: 'public/uploads/b89e47bbef608847129906e6b875c7a5',
											name: 'package.json',
											type: 'application/octet-stream',
											lastModifiedDate: Mon, 13 Feb 2012 02:42:55 GMT,
											_writeStream: 
											{ 	path: 'public/uploads/b89e47bbef608847129906e6b875c7a5',
												fd: 14,
												writable: false,
												flags: 'w',
												encoding: 'binary',
												mode: 438,
												busy: false,
												_queue: [],
												drainable: true
											},
											length: [Getter],
											filename: [Getter],
											mime: [Getter]
										}
									}
									*/
									/* invece content, secondo lo schema del datatype Image, dovrebbe essere una roba tipo
									content:
									{ foto:
										[ {
											'file_name': 	{ type: String },
											'file_path': 	{ type: String },
											'file_type': 	{ type: String },
											'file_size': 	{ type: Number },
											'file_date':{ type: Date },
											'width': 		{ type: Number },
											'height': 		{ type: Number }
										} ]
									}
									*/
									
									//controllo se effettivamente è stato uploadato un file
									if ( contentFiles[field].name != '' &&  contentFiles[field].size > 0 ) {
										//c'è il file
										//prima devo spostare il file nella sua posizione definitiva
										//console.log('sposto file');
										var from = process.cwd()+'/'+contentFiles[field].path;
										//var to = process.cwd()+'/public/'+getContentPath(modelId,content._id)+contentFiles[field].name;
										var to = process.cwd()+'/public/'+getContentPath(modelId,content._id);
										var fs = require('fs');
										//console.log(from);
										//console.log(to);
										var statsFrom = fs.lstatSync(from);
										//console.log(from + ": is a file? " + statsFrom.isFile());										
										//console.log(from + ": is a directory? " + statsFrom.isDirectory());										
										//se la dir non esiste, la creo
										try
										{
											var statsTo = fs.lstatSync(to);
											//console.log(to + ": is a file? " + statsTo.isFile());										
											//console.log(to + ": is a directory? " + statsTo.isDirectory());										
											//console.log('la dir to esiste già');
										}
										catch (e)
										{
											//la dir non esiste
											//console.log('la dir to non esiste');
											//la creo
											mkPath(to);
										}
										
										//sposto il file
										fs.renameSync(from, to+contentFiles[field].name);
										
										//poi posso popolare il content[field]
										var contentField = {};
										contentField.file_name = contentFiles[field].name;
										contentField.file_path = getContentPath(modelId,content._id);
										contentField.file_type = contentFiles[field].type;
										contentField.file_size = contentFiles[field].size;
										contentField.file_date = contentFiles[field].lastModifiedDate;
										//assegno come array, perchè così vuole lo schema
										content[field] = [ contentField ];
									} else {
										//nessun file uplodato
										//il mio contentField non viene popolato
									}
									break;
								default:
									content[field] = contentData[field];
									break;
							}
						}
						/*
						console.log('dopo assegnamento content['+field+']: ');
						console.log(content[field]);
						*/
					}
				}
				/*
				console.log('###### populateContentModel alla fine:');
				console.log('content:');
				console.log(content);
				console.log('contentData:');
				console.log(contentData);
				*/
				//finito di popolare
				next();
				
				
				
			} else {
				console.log("populateContentModel(): element not found");
			}	
		} else {
			console.log("populateContentModel(): failed query to retrieve element");
		}	
			
	});	
	//var jsonSchema = JSON.parse(contentData.jsonModel.jslSchema);
	//console.log('jsonSchema:');
	//console.log(jsonSchema);
}
exports.populateContentModel = populateContentModel; 


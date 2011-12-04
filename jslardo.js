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







//PERMISSIONS
//questi sono wrapper che mi servono per differenziare i permessi in base all'oggetto trattato
function readStrucPermOn_users(req, res, next) {
	readStrucPerm('user', req, res, next);
}
/*
function readStrucPermOn_linkedservers(req, res, next) {
	readStrucPerm('linkedserver', req, res, next);
}
*/
//quando si assegnano i middleware alle routes, prima bisogna sempre leggere i permessi (readStrucPermOn_XXX)
//poi si possono imporre lecondizioni in base ai permessi (needStrucPermXXX)
function needStrucPermCreate(req, res, next) {
	( req.session.canCreate ) ? next() : res.redirect('/');
}
function needStrucPermModifyMine(req, res, next) {
	( req.session.canModifyMine ) ? next() : res.redirect('/');
}
function needStrucPermModifyAll(req, res, next) {
	( req.session.canModifyAll ) ? next() : res.redirect('/');
}
function needStrucPermModifyMyself(req, res, next) {
	( req.session.canModifyMyself ) ? next() : res.redirect('/');
}

//questo metodo viene richiamato prima di eseguire ogni request che lo richiede
//in qualunque controller di qualunque oggetto
function readStrucPerm(on, req, res, next) {
	//console.log('readStrucPerm: req.session.user_id = ' + req.session.user_id);
	//azzero i permessi
	req.session.canCreate = false;
	req.session.canModifyMine = false;
	req.session.canModifyAll = false;
	req.session.canModifyMyself = false; //questo è un permesso che vale solo per l'elemento "users"
	//controllo se sono loggato
	if (req.session.user_id) {
		//l'utente risulta loggato
		//controllo se i suoi dati di login sono validi
		//(questo controllo va fatto ogni volta, perchè se dall'ultimo conrollo l'utente fosse stato cancellato, non me ne accorgerei senza controllo
		checkValidUser(req, function(result, user_id) { 
			if ( result )
			{
				//i dati di login sono validi
				if ( user_id == 'superadmin' )
				{
					//se sono super admin, ho sempre permesso di modify su tutti i contenuti, ma non ho il create
					//questo perchè quando si crea un contenuto, questo è strettamente legato all'utente che lo crea, e il superadmin
					//non è un utente vero è proprio (non è presente nel db, non ha id). il super admin serve solo per poter vedere e modificare tutto, ma non può creare nulla
					req.session.canModifyAll = true;
					req.session.canModifyMyself = true; //questo serve per permettere al super admin di modificare gli utenti (il form di modifica lo richiede)
					//la request puo essere processata
					next();
				}
				else
				{
					//non sono superadmin
					//siccome si tratta di permessi su elementi della struttura, chiunque (loggato) ha sempre il permesso di create nuovi elementi
					//(tranne per il caso degli "user" in cui si creano altri utenti con il bottone "registrati", che però non prevede di essere loggati)
					req.session.canCreate = true;
					//differenzio i permessi di modify in base all'oggetto trattato
					switch (on)
					{
						case 'user':
							//user è un elemento della struttura particolare, perchè, a differenza di tutti gli altri elementi di struttura, ogni utente può solo modificare
							//se stesso. inoltre user non ha un "author_id" poichè un utente è creato da se stesso tramite il bottone "register"
							//nel caso di modifica di users, ho modify solo per modificare me stesso
							if ( req.params.id == req.session.user_id ) //controllo se l'id dell'utente da modificare è quello dell'utente loggato, cioè se modifico me stesso
							{
								//lo user id nella route richiesta corrisponde al mio, quindi posso modificare me stesso (il mio profilo)
								req.session.canModifyMyself = true; 
							}
							break;
						default:
							//ora come ora per tutti gli altri elementi della struttura chiunque ha permesso di modify, ma solo sui propri elementi
							req.session.canModifyMine = true; 
							break;
					}
					//continuo
					next();
					
				}
			}
			else
			{
				//i dati di login non sono validi
				//console.log('readStrucPerm: login NON valido');
				//forzo un logout (potrebbe verificarsi il caso in cui un utente è loggato, e viene cancellato dal db. in quel caso deve avvenire anche il suo logout)
				setSignedOut(req);
				//vengo mandato in home
				res.redirect('/');
			}
		});
		
	} else {
		//console.log('readStrucPerm: utente non loggato');			
		//non sono loggato. l'unica cosa che posso fare è di registrarmi, ovvero creare un nuovo user
		if ( on == 'user' )
		{
			req.session.canCreate = true;
		}
		//non ho nessun permesso, continuo
		next();
	}
}





//SESSIONS
/* controllo nel db se lo user (che sia in POST o dalle sessions) esiste */
function checkValidUser(req, closure)
{
	//console.log('checkValidUser: req.body.login_email='+req.body.login_email);
	//controllo se ho le credenziali in POST (cioè se sto facendo un login dal form), oppure se le ho nelle session (sono già loggato)
	var email = ( req.body && req.body.login_email && req.body.login_email != "" ) ? req.body.login_email : req.session.email;
	var password = ( req.body && req.body.login_password && req.body.login_password != "" ) ? req.body.login_password : req.session.password;
	//prima controllo se si tratta del super admin
	if ( req.app.jsl.config.superadminEmail == email && req.app.jsl.config.superadminPw == password )
	{
		closure(true, 'superadmin'); //se sono super user, salvo come id la parola "superadmin"
	}
	else
	{
		//verifico se effettivamente esiste nel db il mio utente
		var hashedPw = hashPw(req, password);
		//console.log("checkValidUser: hashedPw="+hashedPw);
		req.app.jsl.user.findOne(
			{ 'email': email, 'password': hashedPw },
			function(err, user) {
				if (!err)
				{
					if ( user && user.email == email && user.password == hashedPw )
					{
						//return true;
						closure(true, user._id);
					}
					else
					{
						//return false;
						closure(false, 0);
					}
				}
				else
				{
					//qualcosa è andato storto nella query
					errorPage(res, err, 'jslardo.checkValidUser: ');
				}
			}
		);		
	}
}

/* dopo che è stato effettuato il controllo, questo metodo salva effettivamente le variabili che dicono che l'utente è loggato */
function setSignedIn(req, user_id)
{
	//devo considerare i casi in cui i dati arrivano dal form di login, e il caso in cui arrivano dal form di modifica dell'utente
	if ( req.body && req.body.login_email && req.body.login_email != "" ) 
	{
		var email = req.body.login_email;
	}
	else if ( req.body && req.body.email && req.body.email != "" ) 
	{
		var email = req.body.email;
	}
	if ( req.body && req.body.login_password && req.body.login_password != "" ) 
	{
		var password = req.body.login_password;
	}
	else if ( req.body && req.body.password && req.body.password != "" ) 
	{
		var password = req.body.password;
	}
	//salvo nelle session che il mio utente è loggato
	req.session.email = email;
	req.session.password = password;
	req.session.user_id = user_id;
}

/* slogga l'utente */
function setSignedOut(req)
{
	//resetto le session
	req.session.destroy(function() {});
}

/* hashing delle password */
function hashPw(req, password)
{
	return req.app.jsl.crypto.createHash('sha1').update(password).digest('hex');
}






//PAGINATION
function paginationInit(req, res, next) {
	//numero di pagina corrente
	req.session.pageNum = parseInt(req.params.page) || 1;
	//skip
	req.session.skip = req.app.jsl.config.elementsPerPage * ( req.session.pageNum - 1 );
	//limit
	req.session.limit = req.app.jsl.config.elementsPerPage;
	//la request puo essere processata
	next();

}
function paginationDo(req, total, url) {
	//actual range
	var recordsPerPage = req.app.jsl.config.elementsPerPage;
	var endToRecord = req.session.pageNum * recordsPerPage;
	if( endToRecord > total )
	{
		endToRecord = total;
	}
	var endFromRecord = ((req.session.pageNum-1) * recordsPerPage) +1;
	if ( total > recordsPerPage )
	{
		var currentRangeString = endFromRecord+" - "+endToRecord+" ( tot. "+total+" )";
	}
	//first range - first page link
	if (req.session.pageNum > 1)
	{
		var firstRangeString = "1 - "+recordsPerPage+" ( tot. "+total+" )";
	}
	// prev 10 pages link
	if (req.session.pageNum > 10)
	{
		var prev10LinkPage = req.session.pageNum - 10;
		var prev10RangeFromRecord = ((req.session.pageNum-11) * recordsPerPage) +1;
		var prev10RangeToRecord = ((req.session.pageNum-10) * recordsPerPage);
		var prev10RangeString = prev10RangeFromRecord+" - "+prev10RangeToRecord+" ( tot. "+total+" )";
	}
	//prev page link
	if (req.session.pageNum > 1)
	{
		var prevLinkPage = req.session.pageNum - 1;
		var prevRangeFromRecord = ((req.session.pageNum-2) * recordsPerPage) +1;
		var prevRangeToRecord = ((req.session.pageNum-1) * recordsPerPage);
		var prevRangeString = prevRangeFromRecord+" - "+prevRangeToRecord+" ( tot. "+total+" )";
	}
	//next page link
	var nextTempVar = (recordsPerPage * req.session.pageNum)+1;
	if (nextTempVar <= total)
	{
		var nextLinkPage = req.session.pageNum + 1;
		var nextRangeFromRecord = (req.session.pageNum * recordsPerPage) +1;
		var nextRangeToRecord = ((req.session.pageNum+1) * recordsPerPage);
		if ( nextRangeToRecord > total)
		{
			 nextRangeToRecord = total;
		}
		var nextRangeString = nextRangeFromRecord+" - "+nextRangeToRecord+" ( tot. "+total+" )";
	}
	//next 10 pages link
	var next10TempVar = (recordsPerPage * (req.session.pageNum + 9)) + 1;
	if (next10TempVar <= total)
	{
		var next10LinkPage = req.session.pageNum + 10;
		var next10RangeFromRecord = (( req.session.pageNum + 9 ) * recordsPerPage) + 1;
		var next10RangeToRecord = ((req.session.pageNum + 10) * recordsPerPage);
		if ( next10RangeToRecord > total)
		{
			 next10RangeToRecord = total;
		}
		var next10RangeString = next10RangeFromRecord+" - "+next10RangeToRecord+" ( tot. "+total+" )";
	}
	//last page link
	if (req.session.pageNum < Math.floor(( total - 1 )/recordsPerPage)+1)
	{
		var lastLinkPage = Math.floor(( total - 1 )/recordsPerPage)+1;
		var lastRangeFromRecord = Math.floor(( total-1 ) / recordsPerPage);
		var lastRangeFromRecord = (lastRangeFromRecord * recordsPerPage) +1;
		var lastRangeToRecord = total;
		var lastRangeString = lastRangeFromRecord+" - "+lastRangeToRecord+" ( tot. "+total+" )";
	}
	return {
		firstBtn: { link:url+'1', tooltip:firstRangeString},
		prev10Btn: { link:url+prev10LinkPage, tooltip:prev10RangeString},
		prevBtn: { link:url+prevLinkPage, tooltip:prevRangeString},
		currentLabel: { link:url+req.session.pageNum, tooltip:currentRangeString},
		nextBtn: { link:url+nextLinkPage, tooltip:nextRangeString},
		next10Btn: { link:url+next10LinkPage, tooltip:next10RangeString},
		lastBtn: { link:url+lastLinkPage, tooltip:lastRangeString}
	}
}
	
	
// VARIE

/* visualizza una pagina di errore e logga sulla console */
function errorPage(res, errMsg, publicMsg) {
	console.log(errMsg);
	res.render('error', { 
		errMsg: errMsg,
		publicMsg: publicMsg
	});			
}

/* carica le routes per le pagine interne di jslardo */
function defineRoutes(app) {
	
	//GET: home
	app.get('/', function(req, res){ 
		app.jsl.routeInit(req);
		res.render('home', {
		});
	});

	//POST: login signin
	app.post('/signin', function(req, res) {
		app.jsl.routeInit(req);
		//controllo se esiste il mio utente nel db
		checkValidUser(req, function(result, user_id) { 
			if ( result )
			{
				//ho trovato lo user nel db
				//il login è valido
				setSignedIn(req, user_id);
				console.log("POST: login signin: login succeded for user: "+req.body.login_email);
				//alla fine ricarico la pagina da cui arrivavo
				res.redirect('back');
			}
			else
			{
				//il mio utente non c'è nel db
				setSignedOut(req);
				console.log("POST: login signin: login failed for user: "+req.body.login_email);
				//alla fine ricarico la pagina da cui arrivavo
				res.redirect('back');
			}
		});	
	});
	
	//GET: login signout
	app.get('/signout', function(req, res) {
		app.jsl.routeInit(req);
		//resetto le session
		console.log("POST: login signout: for user: "+req.session.email);
		req.session.destroy(function() {});
		//alla fine ricarico la pagina da cui arrivavo
		res.redirect('back');
	});
	
	//GET: change language
	app.get('/lan/:locale?', function(req, res) {
		app.jsl.routeInit(req);
		//cambio la lingua
		//console.log("cambierei con: "+req.params.locale);
		req.app.i18n.setLocale(req.params.locale);
		//alla fine ricarico la pagina da cui arrivavo
		res.redirect('back');
	});
	
	
	
}

/* carica la route di default da usare quando nessuna altra route è stata matchata */
//non va
function defineRoute404(app) {
	/*
	app.get('*', function(req, res){
		app.jsl.routeInit(req);
		errorPage(res, "404 not found: "+req.path);	
	});	
	*/
}

/*
questa serve quando mi arriva da un form l'oggetto req.body con tutti i campi del form, e devo salvarli nell'oggetto mongoose.
per non dover scrivere condice embedded (un assegnamento per ogni campo del form), c'è questo metodo che loopa su tutti i campi che arrivano dal form
e li salva pari pari nell'oggetto che andrà nel db.
*/
function populateModel(model, modelData) {
	//ciclo su tutte le property che mi arrivano in modelData (le dovrò replicare in model)
	for(var prop in modelData) {
		if(modelData.hasOwnProperty(prop))
		{
			//assegno a model la mia property, ma solo se non si tratta dell'id
			if( prop != "id" )
			{
				model[prop] = modelData[prop];
			}
		}
	}		
	
}

/* questa va richiamata da ogni route, e compie operazioni utili e comuni a tutte le route */
function routeInit(req)
{
	//prima loggo la route in cui sono entrato
	console.log('route matched: ('+req.route.method.toUpperCase()+') '+req.route.path);	
}


exports.defineRoutes = defineRoutes; 
exports.defineRoute404 = defineRoute404; 
exports.errorPage = errorPage; 
exports.setSignedIn = setSignedIn; 
exports.populateModel = populateModel; 
exports.readStrucPermOn_users = readStrucPermOn_users; 
exports.needStrucPermCreate = needStrucPermCreate;
exports.needStrucPermModifyMine = needStrucPermModifyMine;
exports.needStrucPermModifyAll = needStrucPermModifyAll;
exports.needStrucPermModifyMyself = needStrucPermModifyMyself;

exports.checkValidUser = checkValidUser; 
exports.hashPw = hashPw; 
exports.paginationInit = paginationInit; 
exports.paginationDo = paginationDo; 
exports.routeInit = routeInit; 




var sys=require("sys")
exports.CookieAccessInfo=CookieAccessInfo=function(domain,path,secure,script) {
	var $this=(function(){return this;})()===this
		?Object.create(CookieAccessInfo.prototype)
		:this;
	$this.domain=domain||undefined;
	$this.path=path||"/";
	$this.secure=!!secure;
	$this.script=!!script;
	return $this;
}

exports.Cookie=Cookie=function(cookiestr) {
	if(cookiestr instanceof Cookie) {
		return cookiestr;
	}
	var $this=(function(){return this;})()===this
		?Object.create(Cookie.prototype)
		:this;
	$this.name = null;
	$this.value = null;
	$this.expiration_date = Infinity;
	$this.path = "/";
	$this.domain = null;
	$this.secure = false; //how to define?
	$this.noscript = false; //httponly
	if(cookiestr) {
		$this.parse(cookiestr)
	}
	return $this;
}

Cookie.prototype.toString = function() {
	var str=[this.name+"="+this.value];
	if(this.expiration_date !== Infinity) {
		str.push("expires="+(new Date(this.expiration_date)).toGMTString());
	}
	if(this.domain) {
		//Doesnt work on localhost?
		//str.push("domain="+this.domain);
	}
	if(this.path) {
		str.push("path="+this.path);
	}
	if(this.secure) {
		str.push("secure");
	}
	if(this.noscript) {
		str.push("httponly");
	}
	return str.join("; ");
}

Cookie.prototype.toValueString = function() {
	return this.name+"="+this.value;
}

var cookie_str_splitter=/[:](?=\s*[a-zA-Z0-9_\-]+\s*[=])/g
Cookie.prototype.parse = function(str) {
	var $this=(function(){return this;})()===this
		?Object.create(Cookie.prototype)
		:this
	var parts=str.split(";")
	, pair=parts[0].match(/([^=]+)=((?:.|\n)*)/)
	, key=pair[1]
	, value=pair[2];
	//sys.puts("PARSING:"+pair)
	$this.name = key;
	$this.value = value;

	for(var i=1;i<parts.length;i++) {
		pair=parts[i].match(/([^=]+)=((?:.|\n)*)/)
		, key=pair[1].trim().toLowerCase()
		, value=pair[2];
		//sys.puts("PARSING ATTR:'"+(key)+"'")
		switch(key) {
			case "httponly":
				$this.noscript = true;
			break;
			case "expires":
				$this.expiration_date = value
					? Number(Date.parse(value))
					: Infinity;
			break;
			case "path":
				$this.path = value
					? value.trim()
					: "";
			break;
			case "domain":
				$this.domain = value
					? value.trim()
					: "";
			break;
			case "secure":
				$this.secure = true;
			break
		}
	}

	return $this;
}

Cookie.prototype.matches = function(access_info) {
	if(this.noscript && access_info.script
	|| this.secure && !access_info.secure
	|| !this.collidesWith(access_info)) {
		return false
	}
	return true;
}

Cookie.prototype.collidesWith = function(access_info) {
	//sys.puts("COMPARING:",JSON.stringify(this),JSON.stringify(access_info))
	if((this.path && !access_info.path) || (this.domain && !access_info.domain)) {
		//sys.puts("A|")
		return false
	}
	if(this.path && access_info.path.indexOf(this.path) !== 0) {
		//sys.puts("B|")
		return false;
	}
	if (this.domain===access_info.domain) {
		//sys.puts("C|")
		return true;
	}
	else if(this.domain && this.domain.charAt(0)===".")
	{
		var wildcard=access_info.domain.indexOf(this.domain.slice(1))
		//sys.puts([wildcard,access_info.domain.length-this.domain.length+1,access_info.domain,])
		if(wildcard===-1 || wildcard!==access_info.domain.length-this.domain.length+1) {
		//sys.puts("D|")
			return false;
		}
	}
	else if(this.domain){
		return false
	}
	return true;
}

exports.CookieJar=CookieJar=function() {
	var $this=(function(){return this;})()===this
		?Object.create(Cookie.prototype)
		:this;
	var cookies = {} //name: [Cookie]

	//returns cookie if success or falsey if fail
	$this.setCookie = function(cookie) {
		cookie = Cookie(cookie);
		//Delete the cookie if the set is past the current time
		var remove = cookie.expiration_date <= Date.now();
		//sys.puts("remove: "+JSON.stringify(cookie)+" : "+remove)
		if(cookie.name in cookies) {
			var cookies_list = cookies[cookie.name];
			for(var i=0;i<cookies_list.length;i++) {
				var collidable_cookie = cookies_list[i];
				if(collidable_cookie.collidesWith(cookie)) {
					if(remove) {
						cookies_list.splice(i,1);
						if(cookies_list.length===0) {
							delete cookies[cookie.name]
						}
						return false;
					}
					else {
						return cookies_list[i]=cookie;
					}
				}
			}
			if(remove) {
				return false;
			}
			cookies_list.push(cookie);
			return cookie;
		}
		else if(remove){
			return false;
		}
		else {
			return cookies[cookie.name]=[cookie];
		}
	}
	//returns list of cookies that were set correctly
	$this.setCookies = function(cookies) {
		cookies=Array.isArray(cookies)
			?cookies
			:cookies.split(cookie_str_splitter);
		var successful=[]
		for(var i=0;i<cookies.length;i++) {
			var cookie = Cookie(cookies[i]);
			if($this.setCookie(cookie)) {
				successful.push(cookie);
			}
		}
		return successful;
	}
	//returns a cookie
	$this.getCookie = function(cookie_name,access_info) {
		var cookies_list = cookies[cookie_name];
		for(var i=0;i<cookies_list.length;i++) {
			var cookie = cookies_list[i];
			//sys.puts(cookie+" | "+(cookie.expiration_date <= Date.now()))
			if(cookie.expiration_date <= Date.now()) {
				if(cookies_list.length===0) {
					delete cookies[cookie.name]
				}
				continue;
			}
			if(cookie.matches(access_info)) {
				return cookie;
			}
		}
	}
	//returns a list of cookies
	$this.getCookies = function(access_info) {
		var matches=[];
		for(var cookie_name in cookies) {
			var cookie=$this.getCookie(cookie_name,access_info);
			if (cookie) {
				matches.push(cookie);
			}
		}
		matches.toString=function(){return matches.join(":");}
		return matches;
	}

	return $this;
}

//For Connect
exports.handle=function(req,res,next) {
	//sys.puts("cookiejar")
	if(!req.cookies && req.headers && req.headers.host) {
		var jar = CookieJar()
		if(req.headers.cookie) jar.setCookies(
			req.headers.cookie.split(/\s*;\s*/g).map(function(cookiestr){
				return Cookie(cookiestr)
			}
		))
		var cookies = jar.getCookies(CookieAccessInfo(req.headers.host))
		, result = {}
		for(var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i]
			cookies[i] = cookie
			cookies[cookie.name] = cookie
		}
		req.cookies = cookies
		res.cookies = []
		res.cookies.toString = function(){return this.map(function(cookie_or_str){
			return Cookie(cookie_or_str)
		}).join(":");}
	}
	next()
}

var SessionJar = {
	//sessionid : {
	//	ttl
	//	ip
	//	objs
	//}
}
exports.session=function(opts){
	opts = opts || {}
	var cookie_name = opts.cookie || "_session"
	, ttl = opts.ttl || 5*60*1000
	, hash = opts.hash || function() {return Math.random()}
	, noscript = !!!opts.scriptable
	//setup:function() {sys.puts(sys.inspect(arguments))},
	return {
	handle:function(req,res,next) {
		//sys.puts("SESSION")
		//sys.puts(sys.inspect(req))
		if(!req.cookies) {
			exports.handle(req,res,function(){})
		}
		//sys.puts(sys.inspect(req))
		if(!req.cookies) {
			next()
			return
		}
		//sys.puts(sys.inspect(req))
		var cookie=req.cookies[cookie_name]
		var sessionid=cookie
		  ? cookie.value
		  : false
		var session = sessionid
		  ? SessionJar[sessionid]
		  : false
		//sys.puts(sys.inspect(session))
		if (!cookie || !session || session.ttl < new Date().getTime()) {
			//sys.puts("NEW COOKIE")
			delete SessionJar[sessionid]
			//create new session
			sessionid = hash()
			while(SessionJar[sessionid]) {
				sessionid = hash()
			}
			session = SessionJar[sessionid] = {
				//lets be reasonable
				ip: req.remoteAddress
				, objs: {}
			}
			cookie = Cookie()
			cookie.domain = '.'+req.headers.host
			cookie.name = cookie_name
			cookie.value = sessionid
			cookie.noscript = noscript
		}
		//match the ip
		if(session.ip == req.remoteAddress) {
			cookie.expiration_date = session.ttl = new Date(new Date().getTime() + ttl).getTime()
			req.session = session.objs
			res.cookies.push(cookie)
		}
		next()
	}}
}
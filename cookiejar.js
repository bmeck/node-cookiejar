exports.CookieAccessInfo=CookieAccessInfo=function(domain,path,secure,script) {
	var $this=(function(){return this;})()===this
		?Object.create(CookieAccessInfo.prototype)
		:this;
	$this.domain=domain||undefined;
	$this.path=path||undefined;
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
	$this.path = null;
	$this.domain_name = null;
	$this.secure = false;
	$this.noscript = false; //httponly
	if(cookiestr) {
		$this.parse(cookiestr)
	}
	return $this;
}

Cookie.prototype.toString = function() {
	var str=[this.name+"="+this.value];
	if(this.expiration_date !== Infinity) {
		str.push("expires="+Date(this.expiration_date).toString());
	}
	if(this.domain_name) {
		str.push("domain="+this.domain_name);
	}
	if(this.path) {
		str.push("path="+this.domain_name);
	}
	if(this.secure) {
		str.push("secure");
	}
	if(this.noscript) {
		str.push("httponly");
	}
	return str.join(";");
}

Cookie.prototype.toValueString = function() {
	return this.name+"="+this.value;
}

Cookie.prototype.parse = function(str) {
	var $this=(function(){return this;})()===this
		?Object.create(Cookie.prototype)
		:this;
	, parts=str.split(";")
	, pair=parts[0].split("=");
	, key=pair[0];
	, value=pair[1];

	$this.name = key;
	$this.value = value;

	for(var i=1;i<parts.length;i++) {
		pair=parts[i].split("=");
		key=pair[0].trim().toLowerCase();
		value=pair[1];

		switch(key) {
			case "httponly":
				$this.noscript = true;
			break;
			case "expires":
				$this.expiration_date = value
					? Date(value).getTime()
					: Infinity;
			break;
			case "path":
				$this.path = value
					? value.trim()
					: "";
			break;
			case "domain":
				$this.domain_name = value
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
	|| !this.domain || !access_info.domain
	|| (this.domain!==access_info.domain
		&& (this.domain.charAt(0)!=="."
			|| access_info.domain.indexOf(this.domain)!==access_info.domain.length-this.domain.length
		)
	)
	|| !this.path || !access_info.path || access_info.path.indexOf(this.path) !== 0) {
		return false
	}
	return true;
}

Cookie.prototype.collidesWith = function(access_info) {
	if(!this.domain || !access_info.domain
	|| (this.domain!==access_info.domain
		&& (this.domain.charAt(0)!=="."
			|| access_info.domain.indexOf(this.domain)!==access_info.domain.length-this.domain.length
		)
	)
	|| !this.path || !access_info.path || access_info.path.indexOf(this.path) !== 0) {
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
	$this.setCookie(cookie) {
		cookie = Cookie(cookie);
		//Delete the cookie if the set is past the current time
		var remove = cookie.expiration_date <= Date.now();
		if(cookie.name in cookies) {
			var cookies_list = cookies[cookie.name];
			for(var i=0;i<cookie_list.length;i++) {
				var collidable_cookie = cookie_list[i];
				if(collidable_cookie.collidesWith(cookie)) {
					if(remove) {
						cookie_list.splice(i,1);
						return false;
					}
					else {
						return cookie_list[i]=cookie;
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
	$this.setCookies(cookies) {
		cookies=Array.isArray(cookies)
			?cookies
			:cookies.split(":");
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
	$this.getCookie(cookie_name,access_info) {
		var cookies_list = cookies[cookie_name];
		for(var i=0;i<cookies_list.length;i++) {
			var cookie = cookies_list[i];
			if(cookie.expiration_date <= Date.now()) {
				cookies_list.splice(i--,1);
				continue;
			}
			if(cookie.matches(access_info)) {
				return cookie;
			}
		}
	}
	//returns a list of cookies
	$this.getCookies(access_info) {
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
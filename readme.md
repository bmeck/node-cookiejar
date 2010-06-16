#CookieJar

Simple robust cookie library

##Exports


###CookieAccessInfo(domain,path,secure,script)
    class to determine matching qualities of a cookie

#####Properties
* String domain - domain to match
* String path - path to match
* Boolean secure - access is secure (ssl generally)
* Boolean script - access is from a script


###Cookie(cookiestr_or_cookie)
    turns input into a Cookie (singleton if given a Cookie)

#####Properties
* String name - name of the cookie
* String value - string associated with the cookie
* String domain - domain to match (on a cookie a '.' at the start means a wildcard matching anything ending in the rest)
* String path - base path to match (matches any path starting with this '/' is root)
* Boolean noscript - if it should be kept from scripts
* Boolean secure - should it only be transmitted over secure means
* Number expiration_date - number of millis since 1970 at which this should be removed

#####Methods
* String toString() - the __set-cookie:__ string for this cookie
* String toValueString() - the __cookie:__ string for this cookie
* Cookie parse(cookiestr) - parses the string onto this cookie or a new one if called directly
* Boolean matches(access_info) - returns true if the access_info allows retrieval of this cookie
* Boolean collidesWith(cookie) - returns true if the cookies cannot exist in the same space (domain and path match)


###CookieJar()
    class to hold numerous cookies from multiple domains correctly

#####Methods
* Cookie setCookie(cookie) - add a cookie to the jar
* Cookie[] setCookies(cookiestr_or_list) - add a large number of cookies to the jar
* Cookie getCookie(cookie_name,access_info) - get a cookie with the name and access_info matching
* Cookie[] getCookies(access_info) - grab all cookies matching this access_info

##Connect Handlers

###Base

    { module: cookiejar }

Fills the request object's .cookie property w/ an array of cookies via CookieJar.getCookies

###CookieJar.session(options)

    { module: cookiejar.session({ttl: 5000}) }

Fills the request object's .session property and sets the res.cookies to an array that on toString will be converted to a set-cookie header's value string.

* ttl - time to live since last session access in milliseconds [default=browser session]
* hash - way of generating random value for session id (default impl is a simple random floating point)
* cookie - the name of the cookie (useful if you need multiple sessions) [defaults to _session]
* scriptable - if the cookie should be retrievable through scripting on the client's machine [defaults to false]

##Example

	var connect = require('connect-0.0.1/index')
	  , sys = require('sys')
	  , cookiejar = require("cookiejar")
	//sys.puts(sys.inspect(cookiejar))
	var helloWorld = {
		handle: function(req, res, next) {
			try{
				sys.puts(sys.inspect(req))
				var headers= {'Content-Type': 'text/plain',}
				if(res.cookies) {
					headers['Set-Cookie']=res.cookies.toString();
				}
				res.writeHead(200,headers)
				var session=req.session
				if(session) {
					session.files = session.files || ""
					session.files+= req.url+"\n"
					res.end(""+session.files);
				}
				else {
					res.end()
				}
				next()
			}catch(e){sys.puts(e.stack);throw e}
		}
	}
	module.exports = connect.createServer([
		//{ filter: 'debug' } ,
		{ filter: 'response-time'} ,
		{ module: cookiejar.session({ttl: 5000}) } ,
		{ module: helloWorld }
	]);
	module.exports.listen(8888)

#Cookie

Simple robust cookie library

##Exports

###CookieAccessInfo(domain,path,secure,script)
    class to determine matching qualities of a cookie
#####Properties
* domain - domain to match
* path - path to match
* secure - access is secure (ssl)
* script - access if from a script
### Cookie(cookiestr_or_cookie)
    turns input into a Cookie (singleton if given a Cookie)
#####Properties
* domain - domain to match
* path - base path to match
* noscript - if it should be kept from scripts
* secure - should it only be transmitted over secure
* expiration_date - number of millis since 1970 at which this should be removed
#####Methods
* toString() - the __set-cookie:__ string for this cookie
* toValueString() - the __cookie:__ string for this cookie
* parse(cookiestr) - parses the string onto this cookie or a new one if called directly
* matches(access_info) - returns true if the access_info allows retrieval of this cookie
* collidesWith(cookie) - returns true if the cookies cannot exist in the same space (domain and path match)
### CookieJar()
    class to hold numerous cookies from multiple domains correctly
#####Methods
* setCookie(cookie) - add a cookie to the jar
* setCookies(cookiestr_or_list) - add a large number of cookies to the jar
* getCookie(cookie_name,access_info) - get a cookie with the name and access_info matching
* getCookies(access_info) - grab all cookies matching this access_info
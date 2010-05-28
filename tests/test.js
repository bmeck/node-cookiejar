var Cookie=require("../cookiejar")
, CookieAccessInfo = Cookie.CookieAccessInfo
, CookieJar = Cookie.CookieJar
, Cookie = Cookie.Cookie
, sys=require("sys");

var test_jar = CookieJar();
test_jar.setCookies(
	"a=1;domain=.test.com;path=/"
	+":b=2;domain=test.com;path=/"
	+":c=3;domain=test.com;path=/;expires=January 1, 1970");
var cookies=test_jar.getCookies(CookieAccessInfo("test.com","/"))
sys.puts(
	cookies.length==2
	|| "Expires on setCookies fail"+cookies.length+"\n"+cookies.toString());
cookies=test_jar.getCookies(CookieAccessInfo("www.test.com","/"))
sys.puts(
	cookies.length==1
	|| "Wildcard domain fail"+cookies.length+"\n"+cookies.toString());
test_jar.setCookies("b=2;domain=test.com;path=/;expires=January 1, 1970");
cookies=test_jar.getCookies(CookieAccessInfo("test.com","/"))
sys.puts(
	cookies.length==1
	|| "Delete cookie fail"+cookies.length+"\n"+cookies.toString());
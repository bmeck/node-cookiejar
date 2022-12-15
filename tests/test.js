#!/usr/bin/env node
var Cookie=require("../cookiejar"),
    CookieAccessInfo = Cookie.CookieAccessInfo,
    CookieJar = Cookie.CookieJar,
    Cookie = Cookie.Cookie;

var assert = require('assert');

// Test Cookie
var cookie = new Cookie("a=1;domain=.test.com;path=/");
assert.equal(cookie.name, "a");
assert.equal(cookie.value, "1");
assert.equal(cookie.domain, ".test.com");
assert.equal(cookie.path, "/");
assert.equal(cookie.secure, false);
assert.equal(cookie.expiration_date, Infinity);

assert.deepEqual(cookie, new Cookie("a=1;domain=.test.com;path=/"));
assert.ok(cookie.collidesWith(new Cookie("a=1;domain=.test.com;path=/")));

var cookie = new Cookie("a=1;path=/", ".test.com");
assert.equal(cookie.domain, ".test.com");


// Test CookieJar
var test_jar = CookieJar();
test_jar.setCookies(
 "a=1;domain=.test.com;path=/"
 +",b=2;domain=test.com;path=/"
 +",c=3;domain=test.com;path=/;expires=January 1, 1970");
var cookies=test_jar.getCookies(CookieAccessInfo("test.com","/"))
assert.equal(cookies.length, 2, "Expires on setCookies fail\n" + cookies.toString());
assert.equal(cookies.toValueString(), 'a=1; b=2', "Cannot get value string of multiple cookies");

cookies=test_jar.getCookies(CookieAccessInfo("www.test.com","/"))
assert.equal(cookies.length, 2, "Wildcard domain fail\n" + cookies.toString());

test_jar.setCookies("b=2;domain=test.com;path=/;expires=January 1, 1970");
cookies=test_jar.getCookies(CookieAccessInfo("test.com","/"))
assert.equal(cookies.length, 1, "Delete cookie fail\n" + cookies.toString());
assert.equal(String(test_jar.getCookies(CookieAccessInfo("test.com","/"))), "a=1; domain=.test.com; path=/");

cookie=Cookie("a=1;domain=test.com;path=/;HttpOnly");
assert.ok(cookie.noscript, "HttpOnly flag parsing failed\n" + cookie.toString());

var test_jar2 = CookieJar();
test_jar2.setCookies([
        "a=1;domain=.test.com;path=/"
        , "a=1;domain=.test.com;path=/"
        , "a=2;domain=.test.com;path=/"
        , "b=3;domain=.test.com;path=/"]);
var cookies2=test_jar2.getCookies(CookieAccessInfo("test.com","/"))
assert.equal(cookies2.length, 2);
assert.equal(cookies2[0].value, 2);

// Test pure appending
test_jar2.setCookie("d=4;domain=.test.com;path=/");
cookies2=test_jar2.getCookies(CookieAccessInfo("test.com","/"))
assert.equal(cookies2.length, 3);
assert.equal(cookies2[2].value, 4);

// Test Ignore Trailing Semicolons (Github Issue #6)
var cookie = new Cookie("a=1;domain=.test.com;path=/;;;;");
assert.equal(cookie.name, "a");
assert.equal(cookie.value, "1");
assert.equal(cookie.domain, ".test.com");
assert.equal(cookie.path, "/");
assert.deepEqual(cookie, new Cookie("a=1;domain=.test.com;path=/"));

// ensure cookies that are too long are not parsed to avoid any issues with DoS inputs
var too_long_cookie = new Cookie( "foo=" + "blah".repeat( 10000 ) );
assert.equal(too_long_cookie?.name, null);

// Test request_path and request_domain
test_jar2.setCookie(new Cookie("sub=4;path=/", "test.com"));
var cookie = test_jar2.getCookie("sub", CookieAccessInfo("sub.test.com", "/"));
assert.equal(cookie, undefined);

var cookie = test_jar2.getCookie("sub", CookieAccessInfo("test.com", "/"));
assert.equal(cookie.name, "sub");
assert.equal(cookie.domain, "test.com");

test_jar2.setCookie(new Cookie("sub=4;path=/accounts", "test.com", "/accounts"));
var cookie = test_jar2.getCookie("sub", CookieAccessInfo("test.com", "/foo"));
assert.equal(cookie, undefined);

var cookie = test_jar2.getCookie("sub", CookieAccessInfo("test.com", "/accounts"));
assert.equal(cookie.path, "/accounts");

test_jar2.setCookie(new Cookie("sub=5;path=/", "test.com", "/accounts"));
var cookies = test_jar2.getCookies(CookieAccessInfo("test.com"));
assert.equal(cookies.length, 4);

test_jar2.setCookie(new Cookie("sub=5;path=/", "test.com", "/accounts"));
var cookie = test_jar2.getCookie('sub', CookieAccessInfo.All);
assert(cookie);
assert.equal(cookie.name, 'sub');

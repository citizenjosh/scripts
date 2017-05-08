/* Random Tweet Zap
* Every time your attached Twitter account gets a new follower, this Zap will tweet them one of 10 welcome messages.
*
* author:     REPlexus.com
* version:    1.0
*
*
* Zapier input data
* * variable: twitterUserScreenName
* * value: (Follower Screen Name)
*/



/* welcome messages */
var welcomeMessages = [
"Message 1, @"+input.twitterUserScreenName+".",
"Message 2, @"+input.twitterUserScreenName+".",
"Message 3, @"+input.twitterUserScreenName+".",
"Message 4, @"+input.twitterUserScreenName+".",
"Message 5, @"+input.twitterUserScreenName+".",
"Message 6, @"+input.twitterUserScreenName+".",
"Message 7, @"+input.twitterUserScreenName+".",
"Message 8, @"+input.twitterUserScreenName+".",
"Message 9, @"+input.twitterUserScreenName+".",
"Message 10, @"+input.twitterUserScreenName+".",
];

/* determine welcome message */
var textToTweet = welcomeMessages[(Math.floor(Math.random() * 10))];
console.log("textToTweet: "+textToTweet);


/** send a tweet **/
/* needs Single-user OAuth */
var twitterApplicationConsumerKey = '';       // Located in the "Application Settings" section
var twitterApplicationConsumerSecret = '';    // Located in the "Application Settings" section
var twitterApplicationAccessToken = '';       // Located in the "Your Access Token" section
var twitterApplicationAccessTokenSecret = ''; // Located in the "Your Access Token" section


/* OAuthSimple
* A simpler version of OAuth
*
* author:     jr conlin
* mail:       src@anticipatr.com
* copyright:  unitedHeroes.net
* version:    1.0
* url:        http://unitedHeroes.net/OAuthSimple
*
* Copyright (c) 2009, unitedHeroes.net
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*     * Redistributions of source code must retain the above copyright
*       notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above copyright
*       notice, this list of conditions and the following disclaimer in the
*       documentation and/or other materials provided with the distribution.
*     * Neither the name of the unitedHeroes.net nor the
*       names of its contributors may be used to endorse or promote products
*       derived from this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY UNITEDHEROES.NET ''AS IS'' AND ANY
* EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL UNITEDHEROES.NET BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/**
* Computes a HMAC-SHA1 code.
*
* @param {string} k Secret key.
* @param {string} d Data to be hashed.
* @return {string} The hashed string.
*/
function b64_hmac_sha1(k,d,_p,_z){
  if(!_p){_p='=';}if(!_z){_z=8;}function _f(t,b,c,d){if(t<20){return(b&c)|((~b)&d);}if(t<40){return b^c^d;}if(t<60){return(b&c)|(b&d)|(c&d);}return b^c^d;}function _k(t){return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;}function _s(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}function _r(n,c){return(n<<c)|(n>>>(32-c));}function _c(x,l){x[l>>5]|=0x80<<(24-l%32);x[((l+64>>9)<<4)+15]=l;var w=[80],a=1732584193,b=-271733879,c=-1732584194,d=271733878,e=-1009589776;for(var i=0;i<x.length;i+=16){var o=a,p=b,q=c,r=d,s=e;for(var j=0;j<80;j++){if(j<16){w[j]=x[i+j];}else{w[j]=_r(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);}var t=_s(_s(_r(a,5),_f(j,b,c,d)),_s(_s(e,w[j]),_k(j)));e=d;d=c;c=_r(b,30);b=a;a=t;}a=_s(a,o);b=_s(b,p);c=_s(c,q);d=_s(d,r);e=_s(e,s);}return[a,b,c,d,e];}function _b(s){var b=[],m=(1<<_z)-1;for(var i=0;i<s.length*_z;i+=_z){b[i>>5]|=(s.charCodeAt(i/8)&m)<<(32-_z-i%32);}return b;}function _h(k,d){var b=_b(k);if(b.length>16){b=_c(b,k.length*_z);}var p=[16],o=[16];for(var i=0;i<16;i++){p[i]=b[i]^0x36363636;o[i]=b[i]^0x5C5C5C5C;}var h=_c(p.concat(_b(d)),512+d.length*_z);return _c(o.concat(h),512+160);}function _n(b){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",s='';for(var i=0;i<b.length*4;i+=3){var r=(((b[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((b[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((b[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(var j=0;j<4;j++){if(i*8+j*6>b.length*32){s+=_p;}else{s+=t.charAt((r>>6*(3-j))&0x3F);}}}return s;}function _x(k,d){return _n(_h(k,d));}return _x(k,d);
}

//create nonce
function generateRandomString(desiredLengthOfRandomString) {
	var result = '';
	var possibleCharactersForRandomString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < desiredLengthOfRandomString; i++ )
	    result += possibleCharactersForRandomString.charAt(Math.floor(Math.random() * possibleCharactersForRandomString.length));

	return result;
}

var randomString = generateRandomString(32);
var nonce = new Buffer(randomString).toString('base64');


//create timestamp
var timestamp = Math.floor(new Date() / 1000);

//create the signature
var signatureParameterString = 'oauth_consumer_key=' + twitterApplicationConsumerKey + '&oauth_nonce=' + encodeURIComponent(nonce) + '&oauth_signature_method=HMAC-SHA1&oauth_timestamp=' + timestamp + '&oauth_token=' + twitterApplicationAccessToken + '&oauth_version=1.0' + '&status=' + encodeURIComponent(textToTweet);
console.log("signatureParameterString: "+signatureParameterString);

var signatureBaseString = 'POST&https%3A%2F%2Fapi.twitter.com%2F1.1%2Fstatuses%2Fupdate.json&' + encodeURIComponent(signatureParameterString);
console.log("signatureBaseString: "+signatureBaseString);

var signingKey = encodeURIComponent(twitterApplicationConsumerSecret) + '&' + encodeURIComponent(twitterApplicationAccessTokenSecret);

var signature = b64_hmac_sha1(signingKey, signatureBaseString);

// prepare post
var apiUrl = 'https://api.twitter.com/1.1/statuses/update.json?status=' +encodeURIComponent(textToTweet);
console.log("apiUrl: "+apiUrl);


// prepare authentication
var oauthString = 'OAuth oauth_consumer_key="' + twitterApplicationConsumerKey + '", oauth_nonce="' + encodeURIComponent(nonce) + '", oauth_signature="' + encodeURIComponent(signature) + '", oauth_signature_method="HMAC-SHA1", oauth_timestamp="' + timestamp + '", oauth_token="' + twitterApplicationAccessToken + '", oauth_version="1.0"';
console.log("oauthString: "+oauthString);

/* post it */
fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': oauthString
  }
})
.then(function(res) {
  return res.json();
})
.then(function(body) {
  var output = body;
  callback(null, output);
})
.catch(callback);

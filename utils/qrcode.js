'use strict';
 
var el = document.querySelector('.js-qrcode-canvas');
var link = "otpauth://totp/{{NAME}}?secret={{KEY}}";
var name = "Novex QR";
                                              
// remove spaces, hyphens, equals, whatever
var key = "acqo ua72 d3yf a4e5 uorx ztkh j2xl 3wiz".replace(/\W/g, '').toLowerCase();
 
var qr = new QRCode(el, {
  text: link.replace(/{{NAME}}/g, name).replace(/{{KEY}}/g, key)
});


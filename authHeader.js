//import fetch from 'react';
import _sodium from 'libsodium-wrappers';
import _ from 'lodash'

const {base64_variants} = _sodium;
const ttl = "10";//In Minutes

let date = new Date();
const myTimeZone = 5.5;
function initDate(){
  date = new Date();
  date.setTime(new Date().getTime() + myTimeZone * 60 * 60 * 1000 );
}
//Subscriber URL
const subscriber_url = "https://api.leegum.com";
 
//BAP Keys
const signing_public_key = "zFEUhrt4CIu6kc2zqfv04CzQZkepxqCeyw+bq9lAw6A=";
const encr_public_key = "gmi8ZJdxz++A8NpK/OsTxRWRpGejKgglW25mUiBJ1jDFfLyzBryfiLbOtvvtXuKm8dA8HjOLIKLn5Uh0R0hfDQ==";
const bap_private_key = "+gR2PdbCMcaJs76erL9k5on1q/K25ayVZoQJD6JUqabMURSGu3gIi7qRzbOp+/TgLNBmR6nGoJ7LD5ur2UDDoA==";
// const bap_private_key = "zzLqnUPmfEhdKqQgpfdUS4sj3QBBykGSN818E7QAVFM=";//Signing Private Key

// export const createSigningString = async (message: string, created?: string, expires?: string) => {
const createSigningString = async (message, privateKey, created, expires) => {
    //initDate();
    if (!created) created = Math.floor((new Date().getTime()/1000)).toString();
    if (!expires) expires = (parseInt(created) + (parseInt(ttl) * 60)).toString(); //Add required time to create expired
    console.log("created: " + new Date(parseInt(created)).toISOString());
    console.log("expires: " + new Date(parseInt(expires)).toISOString());

    await _sodium.ready;
    const sodium = _sodium;
    const digest = sodium.crypto_generichash(64, sodium.from_string(message));
    const digest_base64 = sodium.to_base64(digest, base64_variants.ORIGINAL);
    const signing_string =
        `(created): ${created}
(expires): ${expires}
digest: BLAKE-512=${digest_base64}`
    console.log(signing_string);

    //Signing the digest using private key
    const signedMessage_ = sodium.crypto_sign_detached(
      signing_string,
      sodium.from_base64(privateKey, base64_variants.ORIGINAL)
    );
    const signedMessage = sodium.to_base64(
      signedMessage_,
      base64_variants.ORIGINAL
    );
    console.log(signedMessage);
    return { signing_string, expires, created, signedMessage }
 }

 const createKeyPair = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  let {publicKey , privateKey} = sodium.crypto_sign_keypair();
  const publicKey_base64 = sodium.to_base64(publicKey, base64_variants.ORIGINAL);
  const privateKey_base64 = sodium.to_base64(privateKey, base64_variants.ORIGINAL);
  //console.log("value: " + publicKey_base64);
  //console.log(privateKey_base64);
  return { publicKey, privateKey };
}

const signMessage = async (signing_string, privateKey) => {
  await _sodium.ready;
  const sodium = _sodium;
  const signedMessage = sodium.crypto_sign_detached(
    signing_string,
    sodium.from_base64(privateKey, base64_variants.ORIGINAL)
  );
  const signedMessage_ = sodium.to_base64(
    signedMessage,
    base64_variants.ORIGINAL
  );
  return sodium.to_base64(signedMessage, base64_variants.ORIGINAL);
}

const createHeader = (uk_id, bap_id, created, expires, signature) =>
{
  let authHeader = `Signature keyId="${bap_id}|${uk_id}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;
  console.log("\n" + authHeader);
  return authHeader;
}

//  let msg = {
//     "context":
//     {
//     "domain":"nic2004:52110",
//     "action":"search",
//     "country":"IND",
//     "city":"std:011",
//     "core_version":"1.0.0",
//     "bap_id":"leegum.com",
//     "bap_uri":"https://leegum.com/ondc/user",
//     "transaction_id":"3df395a9-c196-4678-a4d1-5eaf4f7df8dc",
//     "message_id":"1655281254861",
//     "timestamp":"2022-06-15T08:20:54.861Z"
//   },
//   "message":
//   {
//     "intent":
//     {
//       "fulfillment":
//       {
//         "type":"Delivery"
//       },
//       "payment":
//       {
//         "@ondc/org/buyer_app_finder_fee_type":"percent",
//         "@ondc/org/buyer_app_finder_fee_amount":3
//       }
//     }
//   }
// };

let msg ={"context":{"domain":"nic2004:52110","country":"IND","city":"*","action":"search","core_version":"0.9.1"
,"bap_id":"bap.stayhalo.in"
,"bap_uri":"https://8f9f-49-207-209-131.ngrok.io/protocol/"
,"transaction_id":"f6d9f908-1d26-4ff3-a6d1-3af3d3721054asdf_12"
,"message_id":"b2fe6d52-9fe4-4d1a-9d0b-dccb8b48522dasdf_12"
,"timestamp":"2022-01-04T09:17:55.971Z"}
,"message": {
  "intent": {
    "descriptor": {
      "name": "maggi"
    }
  }
}
}
// ,"bpp_id": "pilot-gateway-1.beckn.nsdl.co.in"
// ,"bpp_uri": "https://pilot-gateway-1.beckn.nsdl.co.in"
// ,"ttl":"P1M"
// ,"message":{"intent":
// {"fulfillment":{"start":{"location":{"gps":"10.108768, 76.347517"}},"end":{"location":{"gps":"10.102997, 76.353480"}}}}}};
let bap_id = "leegum.com";
let bap_uri = subscriber_url;
let core_version = "0.9.1";

msg.context.core_version = core_version;
msg.context.bap_id = bap_id;
msg.context.bap_uri = bap_uri;
//msg.context.ttl = `P${ttl}M`;
//msg.context.transaction_id = "0.9.1";
//msg.context.message_id = "0.9.1"

initDate();
let timestamp = date.toJSON();
//timestamp = timestamp.replace("Z", "000");
// let timestamp = new Date().toJSON();
msg.context.timestamp = timestamp;
console.log(timestamp);

//let created = Math.floor(new Date().getTime() / 1000).toString();
//let expires = (parseInt(created) + (10 * 60 * 60)).toString(); 

const msg_stringified = JSON.stringify(msg);
console.log("\n");
console.log(msg_stringified);
console.log("\n");

async function generateSignature(hash){
  let signature_header = await signMessage(hash.signing_string, bap_private_key);
}
async function generateDigest(){
let hash = await createSigningString(msg_stringified, bap_private_key);//, created, expires);
//.log(hash.signing_string);
//console.log(hash.created);
//.log(hash.expires);
//console.log("\n");
//generateSignature(hash);
let header = createHeader("273", bap_id, hash.created, hash.expires, hash.signedMessage);
//makeApiCall("", msg, header)
}
generateDigest();

// async function makeApiCall(url, data, header){
//   var xhr = new XMLHttpRequest();
//   xhr.open("POST", url, true);
//   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
//   xhr.send(someStuff);

//   fetch("https://pilot-gateway-1.beckn.nsdl.co.in/search", {
//     method: "POST",
//     headers: 
//     {'Content-Type': 'application/json',
//     'Accept': 'application/json', 
//     'Authorization': header}, 
//     body: JSON.stringify(data)
//   }).then(res => {
//     console.log("Request complete! response:", res);
//   });
// }

//const signature_header = signMessage(JSON.stringify(hash.signing_string), bap_private_key);
//console.log(signature_header);

// let keys = createKeyPair()
// console.log("Public Key: " + keys.publicKey);
// console.log("Private Key: " + keys.privateKey);
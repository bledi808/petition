const bcrypt = require("bcryptjs");
let { genSalt, hash, compare } = bcrypt;
const { promisify } = require("util");

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare;
module.exports.hash = (plainTxtPw) =>
    genSalt().then((salt) => hash(plainTxtPw));

// DEMO of how this exported functions above work
// genSalt()
//     .then((salt) => {
//         console.log("salt from genSalt", salt);
//         return hash("safePassword", salt);
//     })
//     .then((hashedPw) => {
//         console.log("hashed and salted pw", hashedPw);
//         return compare("safePassword", hashedPw);
//     })
//     .then((matchValueOfCompare) => {
//         console.log("is this the pw we have stored?", matchValueOfCompare);
//     });

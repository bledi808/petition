// where our db queries live
var spicedPg = require("spiced-pg"); // middleman or client
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); // port 5432 is the standard db port

//////////////////////////////////////// signatures table queries ////////////////////////////////////////

//INSERT submitted signee details to the signatures database; add signature later
module.exports.addSignature = (firstname, lastname, signature) => {
    // console.log(firstname, lastname, signature);
    return db.query(
        `
        INSERT INTO signatures (first, last, signature)
        VALUES ($1, $2, $3)
        RETURNING *
    `,
        [firstname, lastname, signature]
    );
};

//SELECT to get count of signed up users
module.exports.countSignatures = () => {
    return db.query(`SELECT count(*) FROM signatures`);
};

//SELECT to get name and surname of signed up users
module.exports.getSigners = () => {
    return db.query(`SELECT * FROM signatures`);
};
module.exports.getCurrentSigner = (cookie) => {
    return db.query(`SELECT * FROM signatures WHERE id = ${cookie}`);
};

// db is an object that has a method db.query that allows us to query the db
// db.query("SELECT * FROM actors")
//     .then(function (result) {
//         console.log(result.rows[2]);
//     })
//     .catch(function (err) {
//         console.log(err);
//     });

//////////////////////////////////////// users table queries ////////////////////////////////////////

//INSERT submitted signee details to the signatures database; add signature later

module.exports.addUser = (firstname, lastname, email, password, created) => {
    // console.log(firstname, lastname, signature);
    return db.query(
        `
        INSERT INTO users (first, last, email, password, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `,
        [firstname, lastname, email, password, created]
    );
};

// SELECT to get user info by email address (in post /login)
module.exports.getPassword = (email) => {
    return db.query(`SELECT password FROM users WHERE email=${email}`);
};

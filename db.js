// where our db queries live
var spicedPg = require("spiced-pg"); // middleman or client
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); // port 5432 is the standard db port

//////////////////////////////////////// signatures table queries ////////////////////////////////////////

//INSERT submitted signee details to the signatures database; add signature later
module.exports.addSignature = (user_id, signature) => {
    // console.log(user_id, signature);
    return db.query(
        `
        INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2)
        RETURNING *
    `,
        [user_id, signature]
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

module.exports.getCurrentSigner = (user_id) => {
    return db.query(`SELECT * FROM signatures WHERE id=$1`, [user_id]);
};

module.exports.getSignature; // finish writing this

//////////////////////////////////////// users table queries ////////////////////////////////////////

//INSERT submitted signee details to the signatures database; add signature later
module.exports.addUser = (firstname, lastname, email, password) => {
    // console.log(firstname, lastname, signature);
    return db.query(
        `
        INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `,
        [firstname, lastname, email, password]
    );
};

// SELECT to get user info by email address (in post /login)
module.exports.getPassword = (arg) => {
    return db.query(`SELECT * FROM users WHERE email=$1`, [arg]);
};

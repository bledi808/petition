// where our db queries live
var spicedPg = require("spiced-pg"); // middleman or client
var db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); // port 5432 is the standard db port

//////////////////////////////////////// signatures table queries ////////////////////////////////////////

//INSERT signature and user_id to the signatures database; add signature later
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
// module.exports.getSigners = () => {
//     return db.query(`SELECT * FROM users`);
// };

module.exports.getCurrentSigner = (user_id) => {
    return db.query(`SELECT * FROM users WHERE id=$1`, [user_id]);
};

module.exports.showSignature = (user_id) => {
    return db.query(`SELECT signature FROM signatures WHERE user_id=$1`, [
        user_id,
    ]);
};
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

//////////////////////////////////////// profiles table queries ////////////////////////////////////////
module.exports.addProfile = (age, city, url, user_id) => {
    // console.log(user_id, signature);
    return db.query(
        `
        INSERT INTO profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `,
        [age || null, city, url, user_id]
    );
};

//////////////////////////////////////// join table queries ////////////////////////////////////////

// signers page:
// join table using signatures table as the main table
// conditionally render page based on info provided by user (url, age, city)

// To get this info, we'll have to do a join for 3 tables!
//////////////// we need signatures b/c it will tell us whether or not the user signed the petition
//////////////// we need users to get the user's first and last name
//////////////// we need user_profiles to get the signers age, city, and url (if they provided any)

module.exports.getSigners = () => {
    return db.query(`
    SELECT signatures.signature, users.first, users.last, profiles.age, profiles.city, profiles.url 
    FROM signatures
    JOIN users
    ON users.id = signatures.user_id
    JOIN profiles
    ON users.id = profiles.user_id;
    `);
};

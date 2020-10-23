// where our db queries live
var spicedPg = require("spiced-pg"); // middleman or client
var db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
); // port 5432 is the standard db port

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

module.exports.deleteSignature = (user_id) => {
    return db.query(
        `
        DELETE FROM signatures WHERE user_id=$1
        `,
        [user_id]
    );
};

//SELECT to get count of signed up users
module.exports.countSignatures = () => {
    return db.query(`SELECT count(*) FROM signatures`);
};

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

module.exports.getSignersByCity = (city) => {
    return db.query(
        `
    SELECT signatures.signature, users.first, users.last, profiles.age, profiles.city, profiles.url
    FROM signatures
    JOIN users
    ON users.id = signatures.user_id
    LEFT OUTER JOIN profiles
    ON users.id = profiles.user_id
    WHERE LOWER(profiles.city) = LOWER($1);
    `,
        [city]
    );
};
module.exports.getProfile = (user_id) => {
    return db.query(
        `
    SELECT users.first, users.last, users.email, profiles.age, profiles.city, profiles.url
    FROM users
    JOIN profiles
    ON users.id = profiles.user_id 
    WHERE user_id=$1   
    `,
        [user_id]
    );
};

module.exports.updateUsersNoPw = (firstname, lastname, email, userId) => {
    return db.query(
        `
        UPDATE users 
        SET first = $1, last=$2, email=$3
        WHERE id = $4
        RETURNING *

        `,
        [firstname, lastname, email, userId]
    );
};

module.exports.updateUsers = (firstname, lastname, email, password, userId) => {
    return db.query(
        `
        UPDATE users 
        SET first = $1, last=$2, email=$3, password=$4
        WHERE id = $5
        RETURNING *

    `,
        [firstname, lastname, email, password, userId]
    );
};

module.exports.updateProfiles = (age, city, url, userId) => {
    return db.query(
        `
        INSERT INTO profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url =$3
        RETURNING *
        `,
        [age || null, city, url, userId]
    );
};

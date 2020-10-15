// where our db queries live

var spicedPg = require("spiced-pg"); // middleman or client
var db = spicedPg("postgres:postgres:postgres@localhost:5432/actors-exercise"); // port 5432 is the standard db port

//exposed function to add signees details to the signatures database; add signature later
module.exports.addSignature = (firstname, lastname) => {
    return db.query(
        `
    INSERT INTO signatures (first, last)
    VALUES($1,$2)
    `,
        [firstname, lastname]
    );
};

module.exports.getSigners = () => {
    return db.query(`SELECT * FROM signatures`);
};

// db is an object that has a method db.query that allows us to query the db
// db.query("SELECT * FROM actors")
//     .then(function (result) {
//         console.log(result.rows[2]);
//     })
//     .catch(function (err) {
//         console.log(err);
//     });

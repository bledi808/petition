// where our db queries live

var spicedPg = require("spiced-pg"); // middleman or client
var db = spicedPg("postgres:postgres:postgres@localhost:5432/actors-exercise"); // port 5432 is the standard db port

// db is an object that has a method db.query that allows us to query the db
// db.query("SELECT * FROM actors")
//     .then(function (result) {
//         console.log(result.rows[2]);
//     })
//     .catch(function (err) {
//         console.log(err);
//     });

module.exports.getActors = () => {
    return db.query(`SELECT * FROM actors`);
};

module.exports.addActor = (name, age) => {
    return db.query(
        `
    INSERT INTO actors (name, age)
    VALUES($1,$2)
    `,
        [name, age]
    );
};

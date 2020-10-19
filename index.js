// where our routes live
//////////////////////////////////////// DECLARATIONS ////////////////////////////////////////

const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const setHandlebars = handlebars.create({
    helpers: {
        globalHello() {
            // return "hello back";declare global helpers here
        },
    },
});
const { hash, compare } = require("./bc");

//////////////////////////////////////// MIDDLEWARE ////////////////////////////////////////
app.use(
    cookieSession({
        secret: "I'm always angry.",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    })
);
app.use(express.static("./public"));
app.engine("handlebars", setHandlebars.engine);
app.set("view engine", "handlebars");
app.use(
    express.urlencoded({
        extended: false,
    })
);
// app.use(csurf());
// app.use(function (req, res, next) {
//     res.locals.csrfToken = req.csrfToken();
//     res.set("x-frame-options", "DENY");
//     next();
// });

//////////////////////////////////////// ROUTES ///////////////////////////////////////
app.get("/register", (req, res) => {
    const { userId } = req.session;
    if (userId) {
        res.redirect("petition");
    } else {
        res.render("register", {});
    }
});

app.post("/register", (req, res) => {
    // use hash when a user registers, all we need is what a user wants their pw to be
    const { firstname, surname, email, password } = req.body;
    console.log("req.body:", req.body);
    if (firstname !== "" && surname !== "" && email !== "" && password !== "") {
        hash(password)
            .then((hashedPw) => {
                console.log("hashedPw in /register", hashedPw);
                db.addUser(firstname, surname, email, hashedPw)
                    .then((results) => {
                        req.session.userId = results.rows[0].id;
                        // console.log("cookie after:", req.session);
                        res.redirect("/petition"); // maybe reroute to /login ; decide on flow later
                    })
                    .catch((err) => {
                        console.log("error with storing user info", err);
                        res.render("register", {
                            empty: true, // rerender with error msg /make error msgs more specific to error later
                        });
                    });
            })
            .catch((err) => {
                console.log("error with storing user credentials", err);
                res.render("register", {
                    empty: true, //make error msgs more specific to error later
                });
            });
    } else {
        res.render("register", {
            empty: true, // make error msgs more specific to error later
        });
    }
});

app.get("/login", (req, res) => {
    const { userId } = req.session;
    if (userId) {
        res.redirect("petition");
    } else {
        res.render("login", {});
    }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body; // user-entered email and password
    console.log("user-email:", email);
    console.log("user-pw:", password);

    if (email !== "" && password !== "") {
        db.getPassword(email).then((results) => {
            console.log("results", results.rows[0]);
            let hashedPw = results.rows[0].password;
            console.log("hashedPw: ", hashedPw);
            compare(password, hashedPw)
                .then((match) => {
                    console.log("userPw matches hashedPw?", match);
                    // console.log("cookie after login:", req.session);
                    if (match) {
                        req.session.userId = results.rows[0].id;
                        res.render("petition", {});
                    } else {
                        res.render("login", {
                            empty: true, // make error msgs more specific to error later
                        });
                    }
                })
                .catch((err) => {
                    console.log("error in POST /login compare", err);
                    res.render("login", {
                        empty: true, // make error msgs more specific to error later
                    });
                })
                .catch((err) => {
                    console.log("error in POST /login getPassword()", err);
                    res.render("login", {
                        empty: true, // make error msgs more specific to error later
                    });
                });
        });
    } else {
        res.render("login", {
            empty: true, // make error msgs more specific to error later
        });
    }
});

// GET request to root "/" route - redirects to "/petition"
app.get("/", (req, res) => {
    res.redirect("/petition");
});

// GET request to "/petition" route
app.get("/petition", (req, res) => {
    //if signed session "cookie" exists, redirect the user to the signed paged
    const { signed } = req.session;
    if (signed) {
        res.redirect("/signed");
    } else {
        res.render("petition", {
            layout: "main",
        });
    }
});

//POST request on "/petition" route: inserts signee details into signatures table
app.post("/petition", (req, res) => {
    const { firstname, surname, signature } = req.body;
    //if submission successful, set a cookie and redirect user to signed page
    if (firstname !== "" && surname !== "") {
        db.addSignature(firstname, surname, signature)
            .then((results) => {
                // console.log("results:", results);
                req.session.signed = results.rows[0].id;
                res.redirect("/signed");
            })
            .catch((err) => {
                console.log("error with addSignature", err);
            });
    } else {
        res.render("petition", {
            empty: true, // conditional rendering to display "empty input fields" error message
        });
    }
});

// GET request to the "/singed" route
app.get("/signed", (req, res) => {
    //if cookie set, countSignatures and render the row count and the current signer name in "/signed"
    const { signed } = req.session;
    if (signed) {
        db.countSignatures().then((arg) => {
            const count = arg.rows[0].count;
            db.getCurrentSigner(signed).then(({ rows }) => {
                console.log("rows:", rows);
                res.render("signed", {
                    rows,
                    count,
                });
            });
        });
    } else {
        res.redirect("/petition");
    }
});

// GET request to the "/singers" route
app.get("/signers", (req, res) => {
    //if cookie set, get all names of signers and and render in "/signers"
    const { signed } = req.session;
    if (signed) {
        db.getSigners().then(({ rows }) => {
            res.render("signers", {
                rows,
            });
        });
    } else {
        res.redirect("/petition");
    }
});

//////////////////////////////////////// PORT LISTENER ////////////////////////////////////////
app.listen(8080, () =>
    console.log(
        "<><><><><><><><><><><><><><><>| petition listenting |<><><><><><><><><><><><><><><>"
    )
);

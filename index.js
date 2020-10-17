// where our routes live
//////////////////////////////////////// DECLARATIONS ////////////////////////////////////////

const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
const setHandlebars = handlebars.create({
    helpers: {
        globalHello() {
            // return "hello back";declare global helpers here
        },
    },
});

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

//////////////////////////////////////// ROUTES ////////////////////////////////////////

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

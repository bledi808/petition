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
app.use(csurf());
app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    res.set("x-frame-options", "DENY");
    next();
});

//////////////////////////////////////// ROUTES ///////////////////////////////////////
app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
    });
    // .catch((err) => {
    //     console.log("smth went wrong with /register POST", err);
    // });
});

app.post("/register", (req, res) => {
    // use when a user registers, all we need is use what a user wants their pw to be
    //i.e. req.body.password => the name attibute decides what property name you will use when accessing this info server side.
    //for demo purposes we hardcode the userinput below
    hash("userInpt")
        .then((hashedPw) => {
            // store the user's hash password and all other user info in datanase
            //for demo we jsut log it
            console.log("hashedPw in /register".hashedPw);
        })
        .catch((err) => {
            console.log("error in POST register hash", err);
            //if smth goes wrog, rerender /register with an error msg otherwise redirect the user to /petition
        });
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
    // .catch((err) => {
    //     console.log("smth went wrong with /login POST", err);
    // });
});

app.post("/login", (req, res) => {
    // here we want to compare whether the pw the user types matchs the pw stored in db
    // go to db, check if email address provided by user exists and if so SELECT the user's stored password hash
    // for DEMO we hardcode this

    const demoHash = "whatever";
    compare("userInput", demoHash)
        .then((match) => {
            console.log("clear text pw matches the hash?", match);
            //if pw matches, we cab set a cookie to the user's id. if not, we need to rerender /login with an error msg
        })
        .catch((err) => {
            console.log("error in POST /login compare", err);
            // we need to rerender /login with err msg
        });
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

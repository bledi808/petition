// where our routes live

const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
// const { JSDOM } = require("jsdom");
// const { window } = new JSDOM("");
// const $ = require("jquery")(window);
const setHandlebars = handlebars.create({
    helpers: {
        globalHello() {
            // return "hello back";declare global helpers here
        },
    },
});
//////////////////////////////////////// middleware ////////////////////////////////////////

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
    // console.log("get request to '/' root page done");
    //cookie session code
    // console.log("req.session when first set:", req.session);
    // req.session.pimento = "new session value";
    // console.log("req.session after modification:", req.session);
    //cookie code ended
    res.redirect("/petition");
});

// GET request to "/petition" route
app.get("/petition", (req, res) => {
    // console.log("get request to /petition page done");
    //below code only grants access to the page if user has pimento cookie is set - from encounter; modify
    // const {pimento} = req.session;
    // if (pimento) {
    //     res.render("petition", {
    //         layout: "main",
    //     });
    // } else {
    //     res.send(`<h1>Permisision denied</h1>`);
    // }
    // res.send(`<h1>my petition</h1>`);
    const { signed } = req.session;
    if (signed) {
        //if already signed up and cookie "cookie" exists, redirect the user to the signed paged
        res.redirect("/signed");
    } else {
        res.render("petition", {
            layout: "main",
        });
    }
});

//POST request on "/petition" route: inserts signee details into signature table
app.post("/petition", (req, res) => {
    const { firstname, surname, signature } = req.body;
    if (firstname !== "" && surname !== "" && signature !== "") {
        db.addSignature(firstname, surname, signature)
            .then((results) => {
                //if submission successful, set a cookie and redirect user to signed page
                // console.log("results:", results);
                console.log("req.session before:", req.session);
                req.session.signed = results.rows[0].id;
                console.log("req.session after first set:", req.session);
                res.redirect("/signed");
            })
            .catch((err) => {
                console.log("error with addSignature", err);
            });
    } else {
        //re-render petition page with error - CHANGE THIS LATER, for now...
        res.render("petition", {
            empty: true,
        });
    }
});

// GET request to the "/singed" route
app.get("/signed", (req, res) => {
    // console.log("get request to /signed page done");
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
    console.log("get request to /signed page done");
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

///actors route accesses the actors db and returns rows
// app.get("/actors", (req, res) => {
//     db.getActors()
//         .then(({ rows }) => {
//             console.log("results from getActors:", rows);
//             // .then((results) => {
//             //     console.log("results from getActors:", results);
//         })
//         .catch((err) => {
//             console.log("err:", err);
//         });
// });

app.listen(8080, () =>
    console.log(
        "<><><><><><><><><><><><><><><>| petition listenting |<><><><><><><><><><><><><><><>"
    )
);

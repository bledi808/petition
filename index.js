// where our routes live

const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const db = require("./db");
const cookieParser = require("cookie-parser");

const setHandlebars = handlebars.create({
    helpers: {
        globalHello() {
            // return "hello back";declare global helpers here
        },
    },
});
//////////////////////////////////////// middleware ////////////////////////////////////////
app.use(express.static("./public"));
app.engine("handlebars", setHandlebars.engine);
app.set("view engine", "handlebars");
app.use(
    express.urlencoded({
        extended: false,
    })
);

//////////////////////////////////////// GET routes ////////////////////////////////////////

// route to root "/" page - redirects to "/petition"
app.get("/", (req, res) => {
    console.log("get request to '/' root page done");
    res.redirect("/petition");
});

// route to "/petition" page
app.get("/petition", (req, res) => {
    console.log("get request to /petition page done");
    // res.send(`<h1>my petition</h1>`);
    res.render("petition", {
        layout: "main",
    });
});

// route to "/singed" page
app.get("/signed", (req, res) => {
    console.log("get request to /signed page done");
    // res.send(`<h1>my petition</h1>`);
    res.render("signed", {
        layout: "main",
    });
});

//inserts signee details into signature table
app.post("/petition", (req, res) => {
    const { firstname, lastname, submit } = req.body;
    if (submit) {
        db.addSignature(`${firstname}.val()`, `${lastname}.val()`)
            .then(() => {
                res.send(`<h1>thanks for signing</h1>`);
                console.log("sig added");
            })
            .catch((err) => {
                console.log("sig add failed:", err);
            });
    }
});

//from encounter - inserts elements into table when "/<route>" accessed
// app.post("/add-actor", (req, res) => {
//     db.addActor("Juliette Binoche", "55")
//         .then(() => {
//             console.leg("actor added");
//         })
//         .catch((err) => {
//             console.leg("actor add failed:", err);
//         });
// });

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
        "<><><><><><><><><><><>| petition listenting |<><><><><><><><><><><>"
    )
);

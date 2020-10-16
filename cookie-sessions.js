const express = require("express");
const app = express();

//////////cookie sessions encounter
const cookieSession = require("cookie-session");

// place this middle ware about express.static
app.use(
    cookieSession({
        secret: "I'm always angry.",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    })
);
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    console.log("get request to /signed page done");
    res.send(`<h1>my petition</h1>`);
    // res.render("signed", {
    //     layout: "main",
    // });
});

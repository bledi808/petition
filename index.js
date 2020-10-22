// where our routes live
//////////////////////////////////////// DECLARATIONS ////////////////////////////////////////

const express = require("express");
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
const app = (exports.app = express());

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

// GET request to root "/" route - redirects to "/register"
app.get("/", (req, res) => {
    res.redirect("/register");
});

// GET request to "/register" route
app.get("/register", (req, res) => {
    const { userId } = req.session;
    if (userId) {
        res.redirect("/petition");
    } else {
        res.render("register", {});
    }
});

// POST request to "/register" route
app.post("/register", (req, res) => {
    // use hash when a user registers, all we need is what a user wants their pw to be
    const { firstname, surname, email, password } = req.body;
    // console.log("req.body:", req.body);
    if (firstname !== "" && surname !== "" && email !== "" && password !== "") {
        db.getPassword(email)
            .then((results) => {
                // console.log("results", results);
                if (results.rows.length === 0) {
                    hash(password)
                        .then((hashedPw) => {
                            // console.log("hashedPw in /register", hashedPw);
                            db.addUser(firstname, surname, email, hashedPw)
                                .then((results) => {
                                    req.session.userId = results.rows[0].id;
                                    // console.log("cookie after:", req.session);
                                    res.redirect("/profile"); // maybe reroute to /login ; decide on flow later
                                })
                                .catch((err) => {
                                    console.log(
                                        "error with storing user info",
                                        err
                                    );
                                    res.render("register", {
                                        empty: true, // rerender with error msg /make error msgs more specific to error later
                                    });
                                });
                        })
                        .catch((err) => {
                            console.log(
                                "error with storing user credentials",
                                err
                            );
                            res.render("register", {
                                empty: true, //make error msgs more specific to error later
                            });
                        });
                } else {
                    console.log("EMAIL ALREADY IN USE");
                    res.render("register", {
                        empty: true, // make error msgs more specific to error later/EMAIL IS ALREADY TAKEN/USED
                    });
                }
            })
            .catch((err) => {
                console.log("erro in getPassword()", err);
            });
    } else {
        res.render("register", {
            empty: true, // make error msgs more specific to error later
        });
    }
});

// GET request to "/profile" route
app.get("/profile", (req, res) => {
    const { userId, profileCreated } = req.session;

    if (userId) {
        if (profileCreated) {
            res.redirect("/petition");
        } else {
            db.getProfile(userId)
                .then(({ rows }) => {
                    if (rows.length === 0) {
                        res.render("profile");
                    } else {
                        req.session.profileCreated = true;
                        res.redirect("/petition");
                    }
                })
                .catch((err) => {
                    console.log("error with getProfile() in GET /profile", err);
                });
        }
    } else {
        res.redirect("/register");
    }
});

// POST request to "/profile" route
app.post("/profile", (req, res) => {
    const { userId } = req.session;
    const { age, city, url } = req.body;

    db.addProfile(age, city, url, userId)
        .then((results) => {
            console.log("results form POST /profile", results.rows[0]);
            req.session.profileCreated = true;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error with addProfile()", err);
            res.render("profile", {});
        });
});

// GET request to "/login" route
app.get("/login", (req, res) => {
    console.log("req.session at /login:", req.session);
    const { userId } = req.session;
    if (userId) {
        res.redirect("/petition");
    } else {
        res.render("login", {});
    }
});

//POST request to "/login" route
app.post("/login", (req, res) => {
    const { email, password } = req.body; // user-entered email and password
    console.log("user-email:", email);
    console.log("user-pw:", password);

    if (email !== "" && password !== "") {
        db.getPassword(email)
            .then((results) => {
                console.log("results", results.rows[0]);
                let hashedPw = results.rows[0].password;
                console.log("hashedPw: ", hashedPw);
                compare(password, hashedPw)
                    .then((match) => {
                        console.log("userPw matches hashedPw?", match);
                        // console.log("cookie after login:", req.session);
                        if (match) {
                            req.session.userId = results.rows[0].id;
                            console.log(
                                "reqSessionUserID:",
                                req.session.userId
                            );
                            // const { userId } = req.session;
                            db.showSignature(req.session.userId)
                                .then((arg) => {
                                    if (arg.rows.length !== 0) {
                                        req.session.signed = true;
                                    }
                                })
                                .catch((err) => {
                                    console.log(
                                        "error in POST /login with showSignature()",
                                        err
                                    );
                                });
                            res.redirect("/profile");
                        } else {
                            res.render("login", {
                                empty: true, // make error msgs more specific to error later
                            });
                        }
                    })
                    .catch((err) => {
                        console.log(
                            "error in POST /login compare: incorrecr email and/or pw",
                            err
                        );
                        res.render("login", {
                            empty: true, // make error msgs more specific to error later
                        });
                    });
                // .catch((err) => {
                //     console.log("error in POST /login getPassword()", err);
                //     res.render("login", {
                //         empty: true, // make error msgs more specific to error later
                //     });
                // });
            })
            .catch((err) => {
                console.log("error in POST /login with getPassword()", err);
                res.render("login", {
                    empty: true, // make error msgs more specific to error later
                });
            });
    } else {
        res.render("login", {
            empty: true, // make error msgs more specific to error later
        });
    }
});

// GET request to "/petition" route
app.get("/petition", (req, res) => {
    console.log("req.session at /petition:", req.session);
    const { userId } = req.session;

    if (userId) {
        db.showSignature(userId).then((arg) => {
            if (arg.rows.length != 0) {
                req.session.signed = true;
                res.redirect("/petition/signed");
            } else {
                res.render("petition", {});
            }
        });
    } else {
        res.redirect("/register");
    }
});

//POST request on "/petition" route: inserts signature into signatures table
app.post("/petition", (req, res) => {
    const { signature } = req.body;
    const { userId } = req.session;
    if (signature !== "") {
        db.addSignature(userId, signature)
            .then((results) => {
                req.session.signed = true;
                // console.log("results row", results.rows[0]);
                // console.log("signed cookie", req.session);
                res.redirect("/petition/signed");
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

// GET request to the "petition/singed" route
app.get("/petition/signed", (req, res) => {
    //if cookie set, countSignatures and render the row count and the current signer name in "/signed"
    const { userId, signed } = req.session;
    console.log("signed cookie at /signed: ", signed);
    if (signed) {
        db.countSignatures().then((arg) => {
            const count = arg.rows[0].count;
            db.showSignature(userId).then((arg) => {
                const signature = arg.rows[0].signature;
                db.getCurrentSigner(userId).then(({ rows }) => {
                    // console.log("rows:", rows);
                    res.render("signed", {
                        rows,
                        signature,
                        count,
                    });
                });
            });
        });
    } else {
        res.redirect("/petition");
    }
});

// GET request to the "petition/singers" route
app.get("/petition/signers", (req, res) => {
    //if cookie set, get all names of signers and and render in "/signers"
    const { signed } = req.session;

    if (signed) {
        db.getSigners()
            .then(({ rows }) => {
                console.log("rows: ", rows);
                res.render("signers", {
                    rows,
                });
            })
            .catch((err) => {
                console.log("error with getSigners():", err);
            });
    } else {
        res.redirect("/petition");
    }
});

// GET request to the "profile/edit" route
app.get("/profile/edit", (req, res) => {
    const { userId, profileCreated } = req.session;
    // console.log("userId:", userId);
    if (userId) {
        if (profileCreated) {
            db.getProfile(userId)
                .then(({ rows }) => {
                    req.session.retrievedEmail = rows[0].email;
                    res.render("edit", {
                        rows,
                    });
                })
                .catch((err) => {
                    console.log("error with getProfile() in GET /edit", err);
                });
        } else {
            res.redirect("/profile");
        }
    } else {
        res.redirect("/register");
    }
});

// POST request to the "profile/edit" route
app.post("/profile/edit", (req, res) => {
    const { userId, retrievedEmail } = req.session;
    const { firstname, surname, email, password, age, city, url } = req.body;
    if (firstname !== "" && surname !== "" && email !== "") {
        db.getPassword(email).then(({ rows }) => {
            if (rows.length === 0 || rows[0].email === retrievedEmail) {
                if (password == "") {
                    db.updateUsersNoPw(firstname, surname, email, userId)
                        .then(({ rows }) => {
                            // res.redirect("/petition");
                            console.log(
                                "update to users table (excl. Pw col.): ",
                                rows
                            );
                            db.updateProfiles(age, city, url, userId)
                                .then(({ rows }) => {
                                    res.redirect("/petition");
                                    console.log(
                                        "update to profiles table: ",
                                        rows
                                    );
                                })
                                .catch((err) => {
                                    console.log(
                                        "error in POST /edit with updateProfiles(): ",
                                        err
                                    );
                                });
                        })
                        .catch((err) => {
                            console.log(
                                "error in POST /edit with updateUsersNoPw(): ",
                                err
                            );
                        });
                } else {
                    // close if (password)
                    hash(password)
                        .then((hashedPw) => {
                            console.log("hashedPw in /edit", hashedPw);
                            db.updateUsers(
                                firstname,
                                surname,
                                email,
                                hashedPw,
                                userId
                            )
                                .then(({ rows }) => {
                                    console.log(
                                        "update to users table (all cols): ",
                                        rows
                                    );
                                    db.updateProfiles(age, city, url, userId)
                                        .then(({ rows }) => {
                                            res.redirect("/petition");
                                            console.log(
                                                "update to profiles table: ",
                                                rows
                                            );
                                        })
                                        .catch((err) => {
                                            console.log(
                                                "error in POST /edit with updateProfiles(): ",
                                                err
                                            );
                                        });
                                })
                                .catch((err) => {
                                    console.log(
                                        "error in POST /edit with updateUsers(): ",
                                        err
                                    );
                                    res.render("edit", {
                                        empty: true, // render error message properly on edit handlebar
                                    });
                                });
                        })
                        .catch((err) => {
                            console.log(
                                "error in POST /edit with hashedPw(): ",
                                err
                            );
                        });
                } //closes else (password)
            } else {
                //belongs to if email is in use
                res.render("edit", {
                    text: "This email is unavailable",
                    action: "Retry",
                    link: "/profile/edit",
                });
            }
        }); // closes db.getPassword()
    } else {
        //closes if (empty fields)
        res.render("edit", {
            text: "Error updating",
            action: "Retry",
            link: "/profile/edit",
        });
        // res.redirect("/profile/edit");
    }
});

// POST request to delete/signature
app.post("/delete/signature", (req, res) => {
    const { userId } = req.session;
    db.deleteSignature(userId)
        .then(() => {
            req.session.signed = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in petition/signed with deleteSignature()", err);
        });
});

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/login");
});

//////////////////////////////////////// PORT LISTENER ////////////////////////////////////////
if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log(
            "<><><><><><><><><><><><><><><>| petition listenting |<><><><><><><><><><><><><><><>"
        )
    );
}

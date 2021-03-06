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

// const validateUrl = (url) => {
//     if (url) {
//         if (!url.startsWith("http://") && !url.startsWith("https://")) {
//             if (url.startsWith("www")) {
//                 validUrl = "http://" + url;
//                 return validUrl;
//             } else {
//                 field = `make sure your address begins with "http://" or "https://"`;
//                 return field;
//             }
//         }
//     }
// };

app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    const { userId } = req.session;
    if (userId) {
        res.redirect("/petition");
    } else {
        res.render("register", {});
    }
});

app.post("/register", (req, res) => {
    console.log("req.body in /register:", req.body);
    const { firstname, surname, email, password } = req.body;
    if (firstname !== "" && surname !== "" && email !== "" && password !== "") {
        db.getPassword(email)
            .then((results) => {
                if (results.rows.length === 0) {
                    hash(password)
                        .then((hashedPw) => {
                            db.addUser(firstname, surname, email, hashedPw)
                                .then((results) => {
                                    req.session.userId = results.rows[0].id;
                                    res.redirect("/profile");
                                })
                                .catch((err) => {
                                    console.log(
                                        "error with storing user info",
                                        err
                                    );
                                    res.render("register", {});
                                });
                        })
                        .catch((err) => {
                            console.log(
                                "error with storing user credentials",
                                err
                            );
                            res.render("register", {});
                        });
                } else {
                    console.log("email address is already being used");
                    res.render("register", {
                        email: true,
                    });
                }
            })
            .catch((err) => {
                console.log("error in /register with getPassword()!", err);
            });
    } else {
        res.render("register", {
            empty: true,
        });
    }
});

app.get("/login", (req, res) => {
    console.log("req.session at /login:", req.session);
    const { userId } = req.session;
    if (userId) {
        res.redirect("/petition");
    } else {
        res.render("login", {});
    }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email !== "" && password !== "") {
        db.getPassword(email)
            .then((results) => {
                let hashedPw = results.rows[0].password;
                compare(password, hashedPw)
                    .then((match) => {
                        if (match) {
                            req.session.userId = results.rows[0].id;
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
                                login: true, // make error msgs more specific to error later
                            });
                        }
                    })
                    .catch((err) => {
                        console.log(
                            "error in POST /login compare: incorrecr email and/or pw",
                            err
                        );
                        res.render("login", {
                            login: true, // make error msgs more specific to error later
                        });
                    });
            })
            .catch((err) => {
                console.log("error in POST /login with getPassword()", err);
                res.render("login", {
                    login: true, // make error msgs more specific to error later
                });
            });
    } else {
        res.render("login", {
            empty: true, // make error msgs more specific to error later
        });
    }
});

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

app.post("/profile", (req, res) => {
    const { userId } = req.session;
    const { age, city, url } = req.body;
    if (url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            db.addProfile(age, city, url, userId)
                .then(() => {
                    req.session.profileCreated = true;
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("error with addProfile()", err);
                    res.render("profile", {});
                });
        } else {
            res.render("profile", {
                url: true,
            });
        }
    } else {
        db.addProfile(age, city, url, userId)
            .then(() => {
                req.session.profileCreated = true;
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error with addProfile()", err);
                res.render("profile", {});
            });

        // res.redirect("/petition");
    }
});

app.get("/petition", (req, res) => {
    console.log("req.session at /petition:", req.session);
    console.log("req.body at /petition:", req.body);
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

app.post("/petition", (req, res) => {
    const { signature } = req.body;
    const { userId } = req.session;
    console.log("req.session at POST /petition:", req.session);
    console.log("req.body at POST /petition:", req.body);

    if (
        signature !== "" &&
        signature !==
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAACCCAYAAACw2jriAAAFh0lEQVR4Xu3VAQ0AAAjDMPBvGh0sxcF7ku84AgQIECBA4L3Avk8gAAECBAgQIDAG3RMQIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIG3Q8QIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIG3Q8QIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIG3Q8QIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIG3Q8QIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIG3Q8QIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIG3Q8QIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIG3Q8QIECAAIGAgEEPlCgCAQIECBAw6H6AAAECBAgEBAx6oEQRCBAgQICAQfcDBAgQIEAgIGDQAyWKQIAAAQIEDLofIECAAAECAQGDHihRBAIECBAgYND9AAECBAgQCAgY9ECJIhAgQIAAAYPuBwgQIECAQEDAoAdKFIEAAQIECBh0P0CAAAECBAICBj1QoggECBAgQMCg+wECBAgQIBAQMOiBEkUgQIAAAQIHBE0AgyFUM6sAAAAASUVORK5CYII="
    ) {
        db.addSignature(userId, signature)
            .then(() => {
                req.session.signed = true;
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

app.get("/petition/signed", (req, res) => {
    console.log("req.session at /signed:", req.session);
    console.log("req.body at /signed:", req.body);
    const { userId, signed } = req.session;
    console.log("signed cookie at /signed: ", signed);
    if (signed) {
        db.countSignatures().then((arg) => {
            const count = arg.rows[0].count;
            db.showSignature(userId).then((arg) => {
                const signature = arg.rows[0].signature;
                db.getCurrentSigner(userId).then(({ rows }) => {
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

app.get("/petition/signers/:city", (req, res) => {
    console.log("req.session at /city:", req.session);
    console.log("req.params at /city:", req.params);
    const { userId, signed } = req.session;
    const { city } = req.params;

    console.log("city:", city);
    if (userId) {
        if (signed) {
            db.getSignersByCity(city)
                .then(({ rows }) => {
                    console.log("city results.rows[0]:", rows);
                    res.render("city", {
                        rows,
                    });
                })
                .catch((err) => {
                    console.log("error with getSIgnersbyCity()", err);
                });
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/register");
    }
});

app.get("/profile/edit", (req, res) => {
    const { userId, profileCreated } = req.session;

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
            res.redirect("/profile/edit");
        }
    } else {
        res.redirect("/register");
    }
});

app.post("/profile/edit", (req, res) => {
    const { userId, retrievedEmail } = req.session;
    const { firstname, surname, email, password, age, city, url } = req.body;
    if (url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            if (firstname !== "" && surname !== "" && email !== "") {
                db.getPassword(email).then(({ rows }) => {
                    if (rows.length === 0 || rows[0].email === retrievedEmail) {
                        if (password == "") {
                            db.updateUsersNoPw(
                                firstname,
                                surname,
                                email,
                                userId
                            )
                                .then(() => {
                                    db.updateProfiles(age, city, url, userId)
                                        .then(({ rows }) => {
                                            console.log(
                                                "update to profiles table: ",
                                                rows
                                            );
                                            res.render("edit", {
                                                updateSuccess: true,
                                                text:
                                                    "Profile successfully updated",
                                                action: "▶ Continue",
                                                link: "/petition",
                                            });
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
                                            db.updateProfiles(
                                                age,
                                                city,
                                                url,
                                                userId
                                            )
                                                .then(({ rows }) => {
                                                    console.log(
                                                        "update to profiles table: ",
                                                        rows
                                                    );
                                                    res.render("edit", {
                                                        updateSuccess: true,
                                                        text:
                                                            "Profile successfully updated",
                                                        action: "▶ Continue",
                                                        link: "/petition",
                                                    });
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
                        console.log("email already taken in POST /edit");
                        res.render("edit", {
                            popup: true,
                            text: "Email is already taken, try another",
                            action: "◀ Back to Profile",
                            link: "/profile/edit",
                        });
                    }
                }); // closes db.getPassword()
            } else {
                //closes if (empty fields)
                console.log("account fields empty in POST /edit");
                res.render("edit", {
                    popup: true,
                    text: "Name, Surname and Email must be populated",
                    action: "◀ Back to Profile",
                    link: "/profile/edit",
                });
            }
        } else {
            console.log("invalid url in POST /edit");
            res.render("edit", {
                popup: true,
                text: "URL should begin with http(s)://...",
                action: "◀ Back to Profile",
                link: "/profile/edit",
            });
        }
    } else {
        // console.log("no url added in POST /edit");
        // // res.redirect("/petition"); // url field empty; no validation required
        // res.render("edit", {
        //     popup: true,
        //     text: "Profile successfully updated",
        //     action: "▶ Continue",
        //     link: "/petition",
        // });
        if (firstname !== "" && surname !== "" && email !== "") {
            db.getPassword(email).then(({ rows }) => {
                if (rows.length === 0 || rows[0].email === retrievedEmail) {
                    if (password == "") {
                        db.updateUsersNoPw(firstname, surname, email, userId)
                            .then(() => {
                                db.updateProfiles(age, city, url, userId)
                                    .then(({ rows }) => {
                                        console.log(
                                            "update to profiles table: ",
                                            rows
                                        );
                                        res.render("edit", {
                                            updateSuccess: true,
                                            text:
                                                "Profile successfully updated",
                                            action: "▶ Continue",
                                            link: "/petition",
                                        });
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
                                        db.updateProfiles(
                                            age,
                                            city,
                                            url,
                                            userId
                                        )
                                            .then(({ rows }) => {
                                                console.log(
                                                    "update to profiles table: ",
                                                    rows
                                                );
                                                res.render("edit", {
                                                    updateSuccess: true,
                                                    text:
                                                        "Profile successfully updated",
                                                    action: "▶ Continue",
                                                    link: "/petition",
                                                });
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
                    console.log("email already taken in POST /edit");
                    res.render("edit", {
                        popup: true,
                        text: "Email is already taken, try another",
                        action: "◀ Back to Profile",
                        link: "/profile/edit",
                    });
                }
            }); // closes db.getPassword()
        } else {
            //closes if (empty fields)
            console.log("account fields empty in POST /edit");
            res.render("edit", {
                popup: true,
                text: "Name, Surname and Email must be populated",
                action: "◀ Back to Profile",
                link: "/profile/edit",
            });
        }
    }
});

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

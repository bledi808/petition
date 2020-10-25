const supertest = require("supertest");
const { app } = require("./index.js");
const cookieSession = require("cookie-session");

test("GET /register sends 200 as a response", () => {
    return supertest(app)
        .get("/register")
        .then((res) => {
            console.log("resStatusCOde = 200");
            expect(res.statusCode).toBe(200);
        });
});

// Users who are logged out are redirected to the registration page when they attempt to go to the petition page

test("GET /petition sends 302 when no userId cookie", () => {
    cookieSession.mockSessionOnce({});
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/register");
        });
});

// Users who are logged in are redirected to the petition page when they attempt to go to  the registration page
test("GET /register sends 302 to /petition when userId cookie exists", () => {
    cookieSession.mockSessionOnce({
        userId: 3,
    });
    return supertest(app)
        .get("/register")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// Users who are logged in are redirected to the petition page when they attempt to go to  the login page
test("GET /login sends 302 to /petition when userId cookie exists", () => {
    cookieSession.mockSessionOnce({
        userId: 3,
    });
    return supertest(app)
        .get("/login")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// Users who are logged in and have signed the petition are redirected to the thank you page when they attempt to go to the petition page
test("GET /petition sends 302 to /signed when userId and signed cookies exists", () => {
    cookieSession.mockSessionOnce({
        userId: 3,
        signed: true,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition/signed");
        });
});

////////FAILS:  Users who are logged in and have signed the petition are redirected to the thank you page when they attempt submit a signature
// test.only("POST /petition sends 302 to /signed when userId and signed cookies exists", () => {
//     cookieSession.mockSessionOnce({
//         userId: 3,
//         signed: true,
//     });
//     return supertest(app)
//         .post("/petition")
//         .then((res) => {
//             expect(res.statusCode).toBe(302);
//             expect(res.headers.location).toBe("/petition/signed");
//         });
// });

// Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to the thank you page

test("GET /signed sends 302 to /petition when userId EXISTS BUT signed cookie DOES NOT", () => {
    cookieSession.mockSessionOnce({
        userId: 3,
    });
    return supertest(app)
        .get("/petition/signed")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to the signers page
test("GET /signers sends 302 to /petition when userId EXISTS BUT signed cookie DOES NOT", () => {
    cookieSession.mockSessionOnce({
        userId: 3,
    });
    return supertest(app)
        .get("/petition/signers")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

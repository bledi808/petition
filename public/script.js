// event handlers
const canvas = $("#canvas");
const ctx = canvas[0].getContext("2d");
const submitButton = $("#submit");
const signatureInput = $("#signature");
// const canvasVanilla = document.getElementById("canvas");

// console.log("canvas offset left:", canvas.offset().left);
// console.log("canvas offset top:", canvas.offset().top) - 15;

// document.addEventListener("mousedown", (e) => {
//     let x = e.clientX;
//     let y = e.clientY;
//     console.log("x:", x);
//     console.log("y:", y);
// });

canvas.on("mousedown", (e) => {
    let x = e.clientX - canvas.offset().left;
    let y = e.clientY - canvas.offset().top;
    // console.log("x:", x);
    // console.log("y:", y);
    canvas.css({
        cursor: "crosshair",
    });
    ctx.moveTo(x, y);
    ctx.beginPath();

    canvas.on("mousemove", function drawSig(e) {
        let x = e.clientX - canvas.offset().left;
        let y = e.clientY - canvas.offset().top;
        // console.log("xx:", x);
        // console.log("yy:", y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        canvas.on("mouseup", function () {
            canvas.off("mousemove", drawSig);
        });
    });
});

// upon clicking Submit, set value of the hidden sig input field to canvas drawing
submitButton.on("click", () => {
    signatureInput.val(canvas[0].toDataURL());
});

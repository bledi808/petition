// event handlers
const canvas = $("#canvas");
const ctx = canvas[0].getContext("2d");
const submitButton = $("#submit");
const signatureInput = $("#signature");
// const canvasVanilla = document.getElementById("canvas");

canvas.on("mousedown", (e) => {
    let x = e.clientX - canvas.offset().left;
    let y = e.clientY - canvas.offset().top;

    canvas.css({
        cursor: "crosshair",
    });
    ctx.moveTo(x, y);
    ctx.beginPath();

    canvas.on("mousemove", function drawSig(e) {
        let x = e.clientX - canvas.offset().left;
        let y = e.clientY - canvas.offset().top;
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

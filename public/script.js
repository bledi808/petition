// event handlers
console.log("hello");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.addEventListener("mousedown", (e) => {
    let x = e.clientX - canvas.offsetLeft;
    let y = e.clientY - canvas.offsetTop;
    console.log("x:", x);
    console.log("y:", y);
    ctx.moveTo(x, y);
    ctx.beginPath();

    canvas.addEventListener("mousemove", function drawSig(e) {
        let x = e.clientX - canvas.offsetLeft;
        let y = e.clientY - canvas.offsetTop;
        console.log("xx:", x);
        console.log("yy:", y);
        ctx.lineTo(x, y);
        ctx.stroke();
        // ctx.strokeStyle = "tomato";
        // ctx.lineWidth = 5;
        canvas.addEventListener("mouseup", function () {
            canvas.removeEventListener("mousemove", drawSig);
        });
    });
});

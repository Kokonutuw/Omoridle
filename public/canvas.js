const canvas = document.getElementsByClassName('canvas1')[0];
const ctx = canvas.getContext('2d');
const width = canvas.offsetWidth;
const height = canvas.offsetHeight;
const scale = 1
const imageCache = [];
const offScreenCanvas = document.createElement('canvas');
const offScreenCtx = offScreenCanvas.getContext('2d');
let offSreenCanvasX = 0;
let offSreenCanvasY = 0;

let particlesArray;
let imgArray = [
  "/images/assets/etoile.png",
  "/images/assets/bed.png",
  "/images/assets/table.png",
  "/images/assets/satelite.png"
]
let startTime = performance.now()



ctx.scale(scale, scale);

const nbOfParticles = (canvas.height * canvas.width) / 2000;

class Particle {
    constructor(x, y, size, colour) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.colour = colour;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.colour;
        ctx.fill();
        ctx.restore();
    }

    update(){
        if(this.size < 1.5*scale){
            this.size += scale/1.5;
        }
        else{
            this.size -= scale/1.5;
        }        
    }
    updatePosition(){
        this.x += .1;
        if(this.x > canvas.width)
        {
            this.x = 0;
        }
    }
}

function init(){
    particlesArray = [];
    // Calculate grid size
    const n = Math.ceil(Math.sqrt(nbOfParticles));
    const cellWidth = canvas.width / n;
    const cellHeight = canvas.height / n;
    let count = 0;
    for(let row = 0; row < n; row++){
        for(let col = 0; col < n; col++){
            if(count >= nbOfParticles) break;
            // Center of the cell plus a small jitter
            const jitterX = (Math.random() - 0.5) * cellWidth * 0.7;
            const jitterY = (Math.random() - 0.5) * cellHeight * 0.7;
            let x = (col + (0.4 + Math.random() * 0.4)) * cellWidth + jitterX;
            let y = (row + (0.4 + Math.random() * 0.4)) * cellHeight + jitterY;
            let size = 2 * Math.random() * scale;
            let colour = '#fff';
            particlesArray.push(new Particle(x, y, size, colour));
            count++;
        }
    }
}

function preloadImages() {
    for (let i = 0; i < imgArray.length; i++) {
        const img = new Image();
        img.src = imgArray[i];
        imageCache.push(img);
    }

    // Draw images on the off-screen canvas once they are loaded
    Promise.all(imageCache.map(img => new Promise(resolve => {
        img.onload = resolve;
    }))).then(() => {
        drawImagesOnOffScreen();
    });
}

function drawImagesOnOffScreen() {    
    offScreenCanvas.width = canvas.width;
    offScreenCanvas.height = canvas.height;    
    // Ratio scaling permits proper scaling of the images, based on the height of the screen
    const ratioScaling = 1300/canvas.width;
    const AVG_IMG_WIDTH = 65/ratioScaling;    

    let nbLines = Math.floor(canvas.height/(AVG_IMG_WIDTH*3));
    // We want to place 1 image per columns, every 4 * img width (permits proper spacing)
    let nbCols = Math.floor(canvas.width/(AVG_IMG_WIDTH*4));

    nbCols = nbCols == 0 ? 1 : nbCols;
    nbLines = nbLines == 0 ? 1 : nbLines;

    const lineHeight = canvas.height/nbLines;
    const colWidth = (canvas.width/nbCols);

    //console.log(nbCols, nbLines)
    let img = null;
    for (let i = 0; i < nbLines * nbCols; i++) {
        img = imageCache[Math.floor(Math.random() * imageCache.length)];
        const offsetX = (colWidth/6) * (Math.floor(i / nbCols) % 2 == 0 ? 1 : -1) + (colWidth/3);
        const offsetY =  ((lineHeight/6)+ Math.random()*(lineHeight/3) * (i % 2 == 0 ? 1 : -1)) + (lineHeight/6);
        const X = ((i%nbCols) * colWidth) + offsetX
        const Y = (Math.floor(i/nbCols) * lineHeight)+offsetY
        offScreenCtx.drawImage(
            img,
            X,
            Y,
            img.width/ratioScaling,
            img.height/ratioScaling
        );     
    }    
}

function animate(timestamp) {
    diff = timestamp - startTime;


    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offScreenCanvas, offSreenCanvasX, offSreenCanvasY); // Draw the off-screen canvas    
    offSreenCanvasX += .2;
    if(offSreenCanvasX > canvas.width)
    {
        offSreenCanvasX = -canvas.width;
        preloadImages();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offScreenCanvas, offSreenCanvasX, offSreenCanvasY); 
    }

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].updatePosition();
        if(diff >= 2000 || timestamp < 60){
            particlesArray[i].update();                
            startTime = timestamp;              
        }     
        particlesArray[i].draw();    
    }
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas, false);
        
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
init();
preloadImages();
animate();
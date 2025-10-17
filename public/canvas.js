const canvas = document.getElementsByClassName('canvas1')[0];
const ctx = canvas.getContext('2d');
const width = canvas.offsetWidth;
const height = canvas.offsetHeight;
const scale = 1.1 // Scaling constant, you can tweak it to change image size & the nb of lines / columns will adjust automatically on the canva
const imageCache = [];
let floatingImages = []

let particlesArray;
let imgArray = [
  "/images/assets/etoile.png",
  "/images/assets/bed.png",
  "/images/assets/table.png",
  "/images/assets/satelite.png"
]
let startTime = performance.now()



ctx.scale(scale, scale);

const nbOfParticles = (canvas.height * canvas.width) / 1000;

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

class FloatingImage {
    constructor(img, x, y, width, height, vx = 0.2, vy = 0) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = vx;
        this.vy = vy;
	//console.log(x, y);
    }

    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap horizontally for looping effect
        if (this.x > canvas.width) {
            this.x = -this.width;
        }
    }
}

function placeFloatingImages() {
    floatingImages = []; // reset

    const ratioScaling = (900 / canvas.height) / scale;
    const AVG_IMG_WIDTH = 65 / ratioScaling;

    let nbLines = Math.floor(canvas.height / (AVG_IMG_WIDTH * 4));
    let nbCols = Math.floor(canvas.width / (AVG_IMG_WIDTH * 6));
    nbCols = nbCols === 0 ? 2 : nbCols;
    nbLines = nbLines === 0 ? 1 : nbLines;

    const lineHeight = canvas.height / nbLines;
    const colWidth = canvas.width / nbCols;

    for (let i = 0; i < nbLines * nbCols; i++) {
        const img = imageCache[Math.floor(Math.random() * imageCache.length)];
        const offsetX = (colWidth / 6) * (Math.floor(i / nbCols) % 2 === 0 ? 1 : -1) + (colWidth / 3);
        const offsetY = ((lineHeight / 6) + Math.random() * (lineHeight / 3) * (i % 2 === 0 ? 1 : -1)) + (lineHeight / 6);
        const X = ((i % nbCols) * colWidth) + offsetX;
        const Y = (Math.floor(i / nbCols) * lineHeight) + offsetY;

        const scaledWidth = img.width / ratioScaling;
        const scaledHeight = img.height / ratioScaling;

        floatingImages.push(new FloatingImage(img, X, Y, scaledWidth, scaledHeight));
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
    Promise.all(imageCache.map(img => new Promise(resolve => {
         img.onload = resolve;
     }))).then(() => {
         placeFloatingImages(); 
	 animate()
     });
}

function animate(timestamp) {
        diff = timestamp - startTime;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
	window.addEventListener('resize', resizeCanvas, false);
		for (let imgObj of floatingImages) {
		    imgObj.update();
		    imgObj.draw();
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

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();
init();
preloadImages();

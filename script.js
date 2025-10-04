// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 15, 15);
camera.lookAt(0,0,0);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lights ---
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff,0.7);
dirLight.position.set(10,20,10);
scene.add(dirLight);

// --- Player Orb ---
const playerGeo = new THREE.SphereGeometry(0.3,16,16);
const playerMat = new THREE.MeshStandardMaterial({color:0xff00ff, emissive:0xff00ff, emissiveIntensity:0.8});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0,0.3,0);
scene.add(player);

// --- Trail behind player ---
const trailMat = new THREE.MeshBasicMaterial({color:0xff00ff, transparent:true, opacity:0.4});
const trailPoints = [];

// --- Exit Portal ---
const exitGeo = new THREE.TorusGeometry(0.5,0.2,16,100);
const exitMat = new THREE.MeshStandardMaterial({color:0x00ff00, emissive:0x00ff00, emissiveIntensity:1.0});
const exit = new THREE.Mesh(exitGeo, exitMat);
scene.add(exit);

// --- Maze Paths / Walls ---
// Each level is an array of connected points defining the path
const levels = [];

// Level 1
levels.push({
    path:[[0,0],[0,4],[4,4],[4,0],[2,0]], 
    start:[0,0],
    exit:[2,0]
});
// Level 2
levels.push({
    path:[[0,0],[0,5],[5,5],[5,0],[3,0],[3,3]], 
    start:[0,0],
    exit:[3,3]
});
// Level 3
levels.push({
    path:[[0,0],[0,6],[6,6],[6,0],[4,0],[4,4],[2,4]], 
    start:[0,0],
    exit:[2,4]
});
// Level 4
levels.push({
    path:[[0,0],[0,7],[7,7],[7,0],[5,0],[5,5],[2,5],[2,2]], 
    start:[0,0],
    exit:[2,2]
});
// Level 5 (extremely hard)
levels.push({
    path:[[0,0],[0,8],[8,8],[8,0],[6,0],[6,6],[4,6],[4,4],[2,4],[2,2]], 
    start:[0,0],
    exit:[2,2]
});

let currentLevel = 0;

// --- UI ---
const levelText = document.getElementById('level');
const timerText = document.getElementById('timer');
const bestText = document.getElementById('bestTime');
let startTime = Date.now();
let bestTime = localStorage.getItem('pathOfLightBest') || Infinity;

// --- Build Maze Visuals ---
let wallMeshes = [];
function buildMaze(level){
    wallMeshes.forEach(w=>scene.remove(w));
    wallMeshes = [];
    const pts = level.path;
    for(let i=0;i<pts.length-1;i++){
        const dx = pts[i+1][0]-pts[i][0];
        const dz = pts[i+1][1]-pts[i][1];
        const length = Math.sqrt(dx*dx+dz*dz);
        const wallGeo = new THREE.BoxGeometry(length,1,0.3);
        const wallMat = new THREE.MeshStandardMaterial({color:0x00ffff, emissive:0x00ffff, emissiveIntensity:0.6});
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set((pts[i][0]+pts[i+1][0])/2,0.5,(pts[i][1]+pts[i+1][1])/2);
        if(Math.abs(dx)<0.01) wall.rotation.y = Math.PI/2;
        scene.add(wall);
        wallMeshes.push(wall);
    }
    player.position.set(level.start[0],0.3,level.start[1]);
    exit.position.set(level.exit[0],0.3,level.exit[1]);
    startTime = Date.now();
}
buildMaze(levels[currentLevel]);

// --- Movement ---
const keys = {};
document.addEventListener('keydown', e=>keys[e.key.toLowerCase()]=true);
document.addEventListener('keyup', e=>keys[e.key.toLowerCase()]=false);

const speed = 0.08;

function movePlayer(){
    let dx=0,dz=0;
    if(keys['w']||keys['arrowup']) dz-=speed;
    if(keys['s']||keys['arrowdown']) dz+=speed;
    if(keys['a']||keys['arrowleft']) dx-=speed;
    if(keys['d']||keys['arrowright']) dx+=speed;
    
    player.position.x += dx;
    player.position.z += dz;
    
    // add trail
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8), trailMat);
    t.position.set(player.position.x,0.15,player.position.z);
    scene.add(t);
    trailPoints.push(t);
    if(trailPoints.length>50){
        const old = trailPoints.shift();
        scene.remove(old);
    }
}

// --- Check Exit ---
function checkExit(){
    const dist = Math.hypot(player.position.x - exit.position.x, player.position.z - exit.position.z);
    if(dist<0.5){
        const totalTime = (Date.now()-startTime)/1000;
        if(totalTime<bestTime){
            bestTime=totalTime;
            localStorage.setItem('pathOfLightBest',bestTime);
        }
        currentLevel++;
        if(currentLevel>=levels.length){
            alert(`🎉 You completed all levels! Total time: ${totalTime.toFixed(1)}s`);
            currentLevel=0;
        } else {
            alert(`Level ${currentLevel} complete!`);
        }
        levelText.innerText=currentLevel+1;
        buildMaze(levels[currentLevel]);
    }
}

// --- Animate ---
function animate(){
    requestAnimationFrame(animate);
    movePlayer();
    checkExit();
    timerText.innerText=((Date.now()-startTime)/1000).toFixed(1);
    bestText.innerText=bestTime===Infinity?'0.0':parseFloat(bestTime).toFixed(1);
    renderer.render(scene,camera);
}
animate();

// --- Resize ---
window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

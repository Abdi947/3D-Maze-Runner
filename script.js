// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

// --- Camera Top-Down ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(5, 20, 5);
camera.lookAt(5, 0, 5);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lights ---
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// --- Maze Setup ---
const wallSize = 1;

// Define 5 levels
const levels = [];

// LEVEL 1 (easy)
levels.push([
    [1,1,1,1,1,1],
    [1,0,0,0,0,1],
    [1,0,1,1,0,1],
    [1,0,0,1,0,1],
    [1,0,0,0,0,1],
    [1,1,1,1,1,1]
]);

// LEVEL 2
levels.push([
    [1,1,1,1,1,1,1],
    [1,0,0,1,0,0,1],
    [1,1,0,1,0,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1]
]);

// LEVEL 3
levels.push([
    [1,1,1,1,1,1,1,1],
    [1,0,1,0,0,1,0,1],
    [1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1]
]);

// LEVEL 4
levels.push([
    [1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,1,1]
]);

// LEVEL 5 (extremely hard)
levels.push([
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,0,0,1,0,1,0,0,1],
    [1,0,1,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1]
]);

let currentLevel = 0;

// --- UI ---
const levelText = document.getElementById('level');
const timerText = document.getElementById('timer');
const bestText = document.getElementById('bestTime');
let startTime = Date.now();
let bestTime = localStorage.getItem('alienMazeBest') || Infinity;

// --- Player Dot ---
const playerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// --- Exit ---
const exitGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const exitMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 });
const exit = new THREE.Mesh(exitGeometry, exitMaterial);
scene.add(exit);

// --- Floor ---
const floorGeometry = new THREE.PlaneGeometry(20,20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x000022 });
const floor = new THREE.Mesh(floorGeometry,floorMaterial);
floor.rotation.x = -Math.PI/2;
floor.position.set(5,0,5);
scene.add(floor);

// --- Walls ---
let wallMeshes = [];
function buildMaze(levelIndex){
    // remove old walls
    wallMeshes.forEach(w=>scene.remove(w));
    wallMeshes = [];
    const maze = levels[levelIndex];
    for(let i=0;i<maze.length;i++){
        for(let j=0;j<maze[i].length;j++){
            if(maze[i][j]===1){
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(1,1,1),
                    new THREE.MeshStandardMaterial({color:0x00ff00, emissive:0x00ffcc})
                );
                wall.position.set(i+0.5,0.5,j+0.5);
                scene.add(wall);
                wallMeshes.push(wall);
            }
        }
    }
    // Set player start
    player.position.set(1,0.3,1);
    // Set exit
    const exitPos = maze[maze.length-2][maze[0].length-2]===0 ? [maze.length-2,maze[0].length-2] : [maze.length-2,maze[0].length-3];
    exit.position.set(exitPos[0]+0.5,0.3,exitPos[1]+0.5);
    // Reset timer
    startTime = Date.now();
}
buildMaze(currentLevel);

// --- Movement ---
const moveSpeed = 0.1;
const keys = {};
document.addEventListener('keydown', e=>keys[e.key.toLowerCase()]=true);
document.addEventListener('keyup', e=>keys[e.key.toLowerCase()]=false);

function movePlayer(){
    let nextX = player.position.x;
    let nextZ = player.position.z;
    if(keys['w']||keys['arrowup']) nextZ -= moveSpeed;
    if(keys['s']||keys['arrowdown']) nextZ += moveSpeed;
    if(keys['a']||keys['arrowleft']) nextX -= moveSpeed;
    if(keys['d']||keys['arrowright']) nextX += moveSpeed;

    // Collision detection
    const mazeArr = levels[currentLevel];
    const i = Math.floor(nextX);
    const j = Math.floor(nextZ);
    if(mazeArr[i] && mazeArr[i][j]===0){
        player.position.x = nextX;
        player.position.z = nextZ;
    }
}

// --- Animate ---
function animate(){
    requestAnimationFrame(animate);
    movePlayer();

    // Timer
    const currentTime = (Date.now()-startTime)/1000;
    timerText.innerText = currentTime.toFixed(1);
    bestText.innerText = bestTime===Infinity?'0.0':parseFloat(bestTime).toFixed(1);

    // Check exit
    if(Math.abs(player.position.x - exit.position.x)<0.3 && Math.abs(player.position.z - exit.position.z)<0.3){
        const totalTime = (Date.now()-startTime)/1000;
        if(totalTime<bestTime){
            bestTime = totalTime;
            localStorage.setItem('alienMazeBest', bestTime);
        }
        currentLevel++;
        if(currentLevel>=levels.length){
            alert(`🎉 You completed all 5 levels! Total time: ${totalTime.toFixed(1)}s`);
            currentLevel = 0;
        } else {
            alert(`Level ${currentLevel} complete!`);
        }
        levelText.innerText = currentLevel+1;
        buildMaze(currentLevel);
    }

    renderer.render(scene,camera);
}
animate();

// --- Resize ---
window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

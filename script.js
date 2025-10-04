// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// --- Camera (Top-Down) ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(5, 20, 5);
camera.lookAt(5, 0, 5);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Light ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// --- Maze Levels ---
const levels = [];

// Level 1
levels.push([
[1,1,1,1,1,1],
[1,0,0,0,0,1],
[1,0,1,1,0,1],
[1,0,0,1,0,1],
[1,0,0,0,0,1],
[1,1,1,1,1,1]
]);

// Level 2
levels.push([
[1,1,1,1,1,1,1],
[1,0,0,1,0,0,1],
[1,1,0,1,0,1,1],
[1,0,0,0,0,0,1],
[1,0,1,1,1,0,1],
[1,0,0,0,0,0,1],
[1,1,1,1,1,1,1]
]);

// Level 3
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

// Level 4
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

// Level 5 (extremely hard)
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
let bestTime = localStorage.getItem('pathOfLightBest') || Infinity;

// --- Floor ---
const floorGeometry = new THREE.PlaneGeometry(20,20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x000022 });
const floor = new THREE.Mesh(floorGeometry,floorMaterial);
floor.rotation.x = -Math.PI/2;
floor.position.set(5,0,5);
scene.add(floor);

// --- Player Orb ---
const playerGeometry = new THREE.SphereGeometry(0.3,16,16);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive:0xff00ff, emissiveIntensity:0.8 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// --- Exit Portal ---
const exitGeometry = new THREE.BoxGeometry(0.6,0.6,0.6);
const exitMaterial = new THREE.MeshStandardMaterial({ color:0xffff00, emissive:0xffff00, emissiveIntensity:1.2 });
const exit = new THREE.Mesh(exitGeometry, exitMaterial);
scene.add(exit);

// --- Walls ---
let wallMeshes = [];
function buildMaze(levelIndex){
    wallMeshes.forEach(w=>scene.remove(w));
    wallMeshes=[];
    const maze = levels[levelIndex];
    for(let i=0;i<maze.length;i++){
        for(let j=0;j<maze[i].length;j++){
            if(maze[i][j]===1){
                const wall = new THREE.Mesh(
                    new THREE.BoxGeometry(1,1,1),
                    new THREE.MeshStandardMaterial({color:0x00ffff, emissive:0x00ffff, emissiveIntensity:0.6})
                );
                wall.position.set(i+0.5,0.5,j+0.5);
                scene.add(wall);
                wallMeshes.push(wall);
            }
        }
    }
    player.position.set(1,0.3,1);
    const exitPos = maze[maze.length-2][maze[0].length-2]===0 ? [maze.length-2,maze[0].length-2] : [maze.length-2,maze[0].length-3];
    exit.position.set(exitPos[0]+0.5,0.3,exitPos[1]+0.5);
    startTime = Date.now();
}
buildMaze(currentLevel);

// --- Movement ---
const moveSpeed = 0.12;
const keys = {};
document.addEventListener('keydown', e=>keys[e.key.toLowerCase()]=true);
document.addEventListener('keyup', e=>keys[e.key.toLowerCase()]=false);

function movePlayer(){
    let nextX = player.position.x;
    let nextZ = player.position.z;
    if(keys['w']||keys['arrowup']) nextZ -= moveSpeed;
    if(keys['s']||keys['arrowdown']) nextZ += moveSpeed;
    if(keys['a']||keys['arrowleft']) nextX -= moveSpeed;
    if(keys['d']||keys['arrowright']) nextX +=


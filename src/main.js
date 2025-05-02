import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Character } from './character.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Add grid helper
const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
scene.add(gridHelper);

// Add axis helper
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

// Add axis labels
const createAxisLabel = (text, position, color) => {
	const canvas = document.createElement('canvas');
	canvas.width = 128;
	canvas.height = 64;
	const context = canvas.getContext('2d');
	context.fillStyle = 'rgba(0, 0, 0, 0.5)';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.font = '24px Arial';
	context.fillStyle = color;
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillText(text, canvas.width / 2, canvas.height / 2);

	const texture = new THREE.CanvasTexture(canvas);
	const material = new THREE.SpriteMaterial({ map: texture });
	const sprite = new THREE.Sprite(material);
	sprite.position.copy(position);
	sprite.scale.set(5, 2.5, 1);
	scene.add(sprite);
};

createAxisLabel('X', new THREE.Vector3(10, 0, 0), '#ff0000');
createAxisLabel('Y', new THREE.Vector3(0, 10, 0), '#00ff00');
createAxisLabel('Z', new THREE.Vector3(0, 0, 10), '#0000ff');

// Camera and controls setup
camera.position.set(30, 30, 30);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.maxDistance = 100;
controls.minDistance = 10;
controls.update();

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 2);
mainLight.position.set(10, 10, 10);
mainLight.castShadow = true;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// Physics world
const world = new CANNON.World({
	gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Create ground
const groundShape = new CANNON.Plane();
const groundMaterial = new CANNON.Material({ friction: 0.5, restitution: 0.1 });
const groundBody = new CANNON.Body({
	mass: 0,
	material: groundMaterial,
});
groundBody.addShape(groundShape);
groundBody.position.set(0, -1, 0);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Create ground mesh
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterialMesh = new THREE.MeshStandardMaterial({
	color: 0x808080,
	roughness: 0.8,
	metalness: 0.2,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterialMesh);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -1;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Create mouse-following cube
const cubeSize = 10;
const mouseCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const mouseCubeMaterial = new THREE.MeshStandardMaterial({
	color: 0xff0000,
	transparent: true,
	opacity: 0.7,
});
const mouseCube = new THREE.Mesh(mouseCubeGeometry, mouseCubeMaterial);
scene.add(mouseCube);

// Create physics body for the cube
const cubeShape = new CANNON.Box(
	new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2),
);
const cubeBody = new CANNON.Body({
	mass: 1,
	shape: cubeShape,
	type: CANNON.Body.KINEMATIC,
});
world.addBody(cubeBody);

// Create raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create ground plane for raycasting
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// Store all characters
const characters = [];

// Function to create a new character
function createNewCharacter(position = new THREE.Vector3(0, 0, 0)) {
	const character = new Character(world, scene, position);
	characters.push(character);
	return character;
}

// Create initial character
const character = createNewCharacter(new THREE.Vector3(0, 0, 0));

// Function to update cube position based on mouse
function updateMouseCube() {
	raycaster.setFromCamera(mouse, camera);
	const intersection = new THREE.Vector3();
	if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
		intersection.y += cubeSize / 2;
		mouseCube.position.copy(intersection);
		cubeBody.position.copy(intersection);
	}
}

// Handle mouse movement
window.addEventListener('mousemove', (event) => {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Handle mouse click for character movement
window.addEventListener('click', () => {
	raycaster.setFromCamera(mouse, camera);
	const intersection = new THREE.Vector3();
	if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
		character.moveTo(intersection);
	}
});

// Add pause control
let isPaused = true;
const pauseInfo = document.createElement('div');
pauseInfo.style.position = 'absolute';
pauseInfo.style.top = '50px';
pauseInfo.style.width = '100%';
pauseInfo.style.textAlign = 'center';
pauseInfo.style.color = 'white';
pauseInfo.style.fontFamily = 'Arial, sans-serif';
pauseInfo.style.fontSize = '20px';
pauseInfo.innerHTML = 'PAUSED - Press spacebar to start/pause simulation';
document.body.appendChild(pauseInfo);

// Handle keyboard controls
window.addEventListener('keydown', (event) => {
	if (event.code === 'Space') {
		isPaused = !isPaused;
		pauseInfo.innerHTML = isPaused
			? 'PAUSED - Press spacebar to start/pause simulation'
			: 'RUNNING - Press spacebar to start/pause simulation';
	}
});

// Update the animation loop
function animate() {
	const deltaTime = 1 / 60;

	updateMouseCube();

	if (!isPaused) {
		world.step(deltaTime);

		// Update all characters
		characters.forEach((character) => {
			character.update(deltaTime);
		});
	}

	renderer.render(scene, camera);
}

// Set up animation loop
renderer.setAnimationLoop(animate);

// Handle window resize
window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

// Export the character creation function for use in other files
export { createNewCharacter };

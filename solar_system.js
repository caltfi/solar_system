//======================| SOLARSYTEM IN THREE.JS |======================

import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/OrbitControls.js';

// Variables needed for Three.js
let aspectRatio = (window.innerWidth / window.innerHeight);
let scene, camera, renderer, controls, mixer, mixer1, mixer2, delta;
var sunText = document.getElementById('sun');
sunText.load();

const loadingManager = new THREE.LoadingManager();
const clock          = new THREE.Clock();
const listener       = new THREE.AudioListener();
const sound          = new THREE.Audio(listener);
const posSound       = new THREE.PositionalAudio(listener);

loadingManager.onLoad     = () => {console.log('Loaded')};
loadingManager.onProgress = () => {console.log('Loading')};
loadingManager.onError    = () => {console.log('Error!')};

// Window
var width = window.innerWidth;
var height = window.innerHeight;

//planetary orbit radii
const mercuryOrbitRadius = 20;
const venusOrbitRadius = 25;
const earthOrbitRadius = 30;
const marsOrbitRadius = 35;
const jupiterOrbitRadius = 55;
const saturnOrbitRadius = 70;
const uranusOrbitRadius = 80;
const neptuneOrbitRadius = 90;
const plutoOrbitRadius = 100;

// Create Scene
function createScene() {
  scene = new THREE.Scene();
  //scene.background = new THREE.Color('black');
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    'assets/outerspace.jpg',
    () => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    });
}

// Create Camera
function createCamera() {
  camera            = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);
  camera.position.x = 61;
  camera.position.y = 61;
  camera.position.z = -135;
  camera.lookAt(0, 0, 0);
  controls          = new OrbitControls(camera, renderer.domElement);

  camera.add(listener);
}

//Create Sun
function createSun(){
  //Create Sun
  const sun        = new THREE.SphereGeometry(12, 1024, 1024);
  const sunSurface           = new THREE.VideoTexture(sunText);
  sunSurface.generateMipmaps = false;
  sunSurface.minFilter       = THREE.LinearFilter;
  sunSurface.magFilter       = THREE.LinearFilter;
  var sunMaterial            = new THREE.MeshBasicMaterial({map: sunSurface});
  let newSun                 = new THREE.Mesh(sun, sunMaterial);
  newSun.position.set(0, 0, 0);
  newSun.name = 'sun';
  scene.add(newSun);
}

// Create planets
function createPlanets(name, texture, normal, size, isSat, isMoon, orbitRadius) {
  // Planets
  const textLoader  = new THREE.TextureLoader(loadingManager);
  const imgTexture  = textLoader.load(texture);
  const normTexture = textLoader.load(normal);
  const planet      = new THREE.SphereGeometry(size, 1024, 1024);
  const surface     = new THREE.MeshStandardMaterial({map: imgTexture});
  surface.normalMap = normTexture;
  let newPlanet     = new THREE.Mesh(planet, surface);
  newPlanet.rotation.y += 0.005;

  //Planetary Ring (Is Saturn? True or False)
  if (isSat == true){
    const saturnGroup = new THREE.Group();

    const geometry     = new THREE.PlaneGeometry(9, 9);
    const ringTexture  = textLoader.load('./assets/ring.png');
    const material     = new THREE.MeshBasicMaterial({map: ringTexture, side: THREE.DoubleSide});
    material.transparent = true;
    let rings          = new THREE.Mesh( geometry, material );
    
    //Placing rings
    rings.rotation.x = 5;
    rings.name       = `${name}Rings`;
    
    saturnGroup.add(rings);
    saturnGroup.add(newPlanet);
    saturnGroup.name = name;
    scene.add(saturnGroup);
  }else{
    // Does planet have a moon?
    if (isMoon == true){
      const moon         = new THREE.SphereGeometry(size/5, 1024, 1024);
      const moonTexture  = textLoader.load(`./assets/${name}Moon.jpeg`);
      const moonSurface  = new THREE.MeshBasicMaterial({map: moonTexture});
      let newMoon        = new THREE.Mesh( moon, moonSurface );
      
      //Placing Moon on Moon orbit
      newMoon.position.x = 2;
      newMoon.name       = `${name}Moon`;
    
      const point = new THREE.Object3D();
      scene.add(point);
      point.add(newMoon);
      point.position.y = 2;
      point.name       = `${name}MoonOrbit`;
    }

    //Placing planets
    newPlanet.name        = name;
    scene.add(newPlanet);
  }

  //add planet orbit radius line
  const segments = 64;
  const orbitLineGeometry = new THREE.BufferGeometry();
  const orbitLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
  const orbitLineVertices = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = orbitRadius * Math.cos(theta);
    const z = orbitRadius * Math.sin(theta);

    orbitLineVertices.push(x, 0, z);
  }

  orbitLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitLineVertices, 3));
  const orbitLine = new THREE.Line(orbitLineGeometry, orbitLineMaterial);
  orbitLine.position.y = 0;
  orbitLine.position.x = 0;
  orbitLine.position.z = 0;
  orbitLine.name = `${name}OrbitLine`;
  scene.add(orbitLine);
}

function updatePlanetOrbit(planetName, rotationSpeed, orbitRadius) {
  const planet = scene.getObjectByName(planetName);
  const orbitCenter = scene.getObjectByName('sun').position;

  const angle = rotationSpeed * clock.getElapsedTime();
  const x = orbitCenter.x + orbitRadius * Math.cos(angle);
  const y = 0;
  const z = orbitCenter.z + orbitRadius * Math.sin(angle);

  planet.position.set(x, y, z);
}

// Create main asteroid belt
function createAsteroidBelt(radius, numberOfAsteroids) {
  const asteroidBelt = new THREE.Group();

  for (let i = 0; i < numberOfAsteroids; i++) {
    const angle = (i / numberOfAsteroids) * Math.PI * 2;

    const randomOffset = (Math.random() - 0.5) * 3;
    const adjustedRadius = radius + randomOffset

    // Calculate the position of the asteroid in a perfect circle
    const x = Math.cos(angle) * adjustedRadius;
    const z = Math.sin(angle) * adjustedRadius;

    // Create a small white sphere for the asteroid
    const asteroidGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const asteroidMesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

    // Set the position of the asteroid
    asteroidMesh.position.set(x, 0, z);

    // Add the asteroid to the asteroidBelt group
    asteroidBelt.add(asteroidMesh);
  }

  // Set the position of the asteroidBelt group (position of the sun)
  asteroidBelt.position.set(0, 0, 0);

  // Add the asteroidBelt group to the scene
  scene.add(asteroidBelt);
}


// Create lighting
function createLight(){
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0xffffff, 0.3);
  spotLight.position.set(8, 19, 2);
  spotLight.castShadow = true;

  const spotLight2 = new THREE.SpotLight(0xffffff, 0.2);
  spotLight2.position.set(-2, -5, 2);
  spotLight2.castShadow = true;

  scene.add(spotLight, spotLight2);
}

function onWindowResize() {
  width = window.innerWidth;
  height = window.innerHeight;

  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

//Renderer
function createRenderer() {
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true
   });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1.0);
  document.body.appendChild(renderer.domElement);
}

// Initialise & create the scene in web browser
function animate() {
  window.requestAnimationFrame(animate);
  //The Sun
  scene.getObjectByName('sun').rotation.y       += 0.001;

  //planet rotations
  scene.getObjectByName('mercury').rotation.y   += 0.005;
  scene.getObjectByName('venus').rotation.y     += 0.005;
  scene.getObjectByName('earth').rotation.y     += 0.005;
  scene.getObjectByName('earthMoon').rotation.y += 0.008; 
  scene.getObjectByName('earthMoonOrbit').rotation.y += 0.005; 
  scene.getObjectByName('mars').rotation.y      += 0.005;
  scene.getObjectByName('jupiter').rotation.y   += 0.001;
  scene.getObjectByName('saturn').rotation.y    += 0.005;
  scene.getObjectByName('saturnRings').rotation.z += 0.005;
  scene.getObjectByName('uranus').rotation.y    += 0.005;
  scene.getObjectByName('neptune').rotation.y   += 0.005;
  scene.getObjectByName('pluto').rotation.y     += 0.005;

  //All the planets
  updatePlanetOrbit('mercury', 0.1, mercuryOrbitRadius);
  updatePlanetOrbit('venus', 0.09, venusOrbitRadius);

  updatePlanetOrbit('earth', 0.08, earthOrbitRadius);
  updatePlanetOrbit('earthMoonOrbit', 0.08, earthOrbitRadius);

  updatePlanetOrbit('mars', 0.06, marsOrbitRadius);
  updatePlanetOrbit('jupiter', 0.05, jupiterOrbitRadius);
  updatePlanetOrbit('saturn', 0.04, saturnOrbitRadius);
  updatePlanetOrbit('uranus', 0.03, uranusOrbitRadius);
  updatePlanetOrbit('neptune', 0.02, neptuneOrbitRadius);
  updatePlanetOrbit('pluto', 0.01, plutoOrbitRadius);

  delta = clock.getDelta();
  if(mixer){
    mixer.update(delta);
  }

  if(mixer1){
    mixer1.update(delta);
  }

  if(mixer2){
    mixer2.update(delta);
  }

  renderer.render(scene, camera);
}

function init() {
  createRenderer();
  createCamera();
  createScene();
  window.addEventListener( 'resize', onWindowResize, false );
  //The Sun
  createSun();
  createLight();
  //All the planets
  createPlanets('mercury', './assets/mercury.jpg', './assets/mercurynormal.jpeg',  0.3, false, false, mercuryOrbitRadius);
  createPlanets('venus', './assets/venus.webp', './assets/mercurynormal.jpeg',     0.5, false, false, venusOrbitRadius);
  createPlanets('earth', './assets/earthmap4k.webp', './assets/earthnormal.png',   1, false,  true, earthOrbitRadius);
  createPlanets('mars', './assets/mars1k.jpg', './assets/marsnormal.png',          1, false, false, marsOrbitRadius);
  createPlanets('jupiter', './assets/jupiter.jpg', './assets/jupiternormal.png',   3, false, false, jupiterOrbitRadius);
  createPlanets('saturn', './assets/saturn.webp', './assets/jupiternormal.png',    2,  true, false, saturnOrbitRadius);
  createPlanets('uranus', './assets/uranus.webp', './assets/neptunenormal.jpeg',   1.2, false, false, uranusOrbitRadius);
  createPlanets('neptune', './assets/neptune.jpeg', './assets/neptunenormal.jpeg', 1.2, false, false, neptuneOrbitRadius);
  createPlanets('pluto', './assets/pluto.jpeg', './assets/marsnormal.png',         0.3, false, false, plutoOrbitRadius);
  //create the main asteroid belt
  createAsteroidBelt(40, 300);
  //create the kuiper asteroid belt
  createAsteroidBelt(110, 800);

  animate();
}

init();
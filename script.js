
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = id => document.getElementById(id);
const canvas = $('space');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050711');
scene.fog = new THREE.FogExp2('#050711', 0.0008);

const camera = new THREE.PerspectiveCamera(
  50, innerWidth / innerHeight, 0.1, 2000
);
camera.position.set(0, 42, 100);

const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 220;

scene.add(new THREE.AmbientLight(0x8294cf, 1.2));

const sunLight = new THREE.PointLight(0xffd5a0, 1500, 500, 1.5);
scene.add(sunLight);

// Star field
const starPositions = [];
for (let i = 0; i < 6500; i++) {
  const r = 150 + Math.random() * 700;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  starPositions.push(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xb9c8ff,
    size: 0.8,
    transparent: true,
    opacity: 0.9
  })
);
scene.add(stars);

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(4.8, 48, 48),
  new THREE.MeshBasicMaterial({ color: 0xffc56d })
);
scene.add(sun);

const glowCanvas = document.createElement('canvas');
glowCanvas.width = glowCanvas.height = 128;

const ctx = glowCanvas.getContext('2d');
const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
gradient.addColorStop(0, 'rgba(255,210,125,0.9)');
gradient.addColorStop(0.2, 'rgba(255,145,65,0.3)');
gradient.addColorStop(1, 'rgba(255,110,35,0)');

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 128, 128);

const glow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: new THREE.CanvasTexture(glowCanvas),
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
}));
glow.scale.set(30, 30, 1);
scene.add(glow);

// Planet data. Distances and orbital speeds are visually scaled.
const planets = [
  {
    name: 'Mercury', type: 'TERRESTRIAL PLANET',
    color: 0x9d9b9b, radius: 7.5, size: 0.65, speed: 0.8,
    day: '58.6 days', moons: '0', diameter: '4,879 km',
    desc: 'A small, cratered world racing around the Sun. Its surface experiences extreme temperature swings.'
  },
  {
    name: 'Venus', type: 'TERRESTRIAL PLANET',
    color: 0xe7b77f, radius: 11, size: 1.0, speed: 0.55,
    day: '243 days', moons: '0', diameter: '12,104 km',
    desc: 'A bright world wrapped in dense clouds. Its greenhouse atmosphere makes it the hottest planet.'
  },
  {
    name: 'Earth', type: 'TERRESTRIAL PLANET',
    color: 0x3e91ff, radius: 15, size: 1.12, speed: 0.4,
    day: '24 hours', moons: '1', diameter: '12,742 km',
    desc: 'Our home planet, a world of liquid oceans and a protective atmosphere. The only known world with life.'
  },
  {
    name: 'Mars', type: 'TERRESTRIAL PLANET',
    color: 0xe16b4b, radius: 19, size: 0.86, speed: 0.32,
    day: '24.6 hours', moons: '2', diameter: '6,779 km',
    desc: 'The red planet preserves ancient river valleys and polar ice. Robotic explorers study its past.'
  },
  {
    name: 'Jupiter', type: 'GAS GIANT',
    color: 0xd9b18b, radius: 27, size: 3.2, speed: 0.22,
    day: '9.9 hours', moons: '95+', diameter: '139,820 km',
    desc: 'The giant of our planetary system. Its turbulent clouds include enormous storms.'
  },
  {
    name: 'Saturn', type: 'GAS GIANT',
    color: 0xe7d0a0, radius: 36, size: 2.65, speed: 0.17,
    day: '10.7 hours', moons: '146+', diameter: '116,460 km',
    desc: 'A gas giant surrounded by spectacular rings made mostly of ice and rocky debris.'
  },
  {
    name: 'Uranus', type: 'ICE GIANT',
    color: 0x87d9e3, radius: 44, size: 1.8, speed: 0.13,
    day: '17.2 hours', moons: '28', diameter: '50,724 km',
    desc: 'An icy giant that rotates on its side. Methane gives this distant world its blue-green color.'
  },
  {
    name: 'Neptune', type: 'ICE GIANT',
    color: 0x4c70f4, radius: 51, size: 1.75, speed: 0.1,
    day: '16.1 hours', moons: '16', diameter: '49,244 km',
    desc: 'A cold, distant world swept by supersonic winds, far beyond the Sun’s warmth.'
  }
];

const planetObjects = [];
const pickables = [];
const planetList = $('planetList');

function createTexture(color, seed) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;

  const context = c.getContext('2d');
  const base = new THREE.Color(color);
  context.fillStyle = '#' + base.getHexString();
  context.fillRect(0, 0, 512, 256);

  let state = seed * 17 + 31;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let i = 0; i < 160; i++) {
    context.fillStyle = random() > 0.5
      ? 'rgba(255,255,255,0.13)'
      : 'rgba(0,0,0,0.15)';

    context.beginPath();
    context.ellipse(
      random() * 512, random() * 256,
      15 + random() * 100, 2 + random() * 22,
      0, 0, Math.PI * 2
    );
    context.fill();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

planets.forEach((p, index) => {
  const pivot = new THREE.Group();
  scene.add(pivot);

  const material = new THREE.MeshStandardMaterial({
    map: createTexture(p.color, index + 1),
    roughness: 0.88
  });

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.size, 48, 48),
    material
  );

  mesh.position.x = p.radius;
  mesh.userData.index = index;
  pivot.add(mesh);

  // Orbit path
  const points = [];
  for (let i = 0; i < 240; i++) {
    const a = i / 240 * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(a) * p.radius,
      0,
      Math.sin(a) * p.radius
    ));
  }

  const orbit = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: 0x8490bd,
      transparent: true,
      opacity: 0.24
    })
  );
  scene.add(orbit);

  // Saturn's rings
  if (p.name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(p.size * 1.35, p.size * 2.15, 96),
      new THREE.MeshStandardMaterial({
        color: 0xc9b18a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      })
    );

    ring.rotation.x = -Math.PI / 2.35;
    mesh.add(ring);
  }

  // Earth's moon
  let moonOrbit = null;
  if (p.name === 'Earth') {
    moonOrbit = new THREE.Group();
    moonOrbit.position.copy(mesh.position);
    pivot.add(moonOrbit);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xcbd0da })
    );

    moon.position.x = 2;
    moonOrbit.add(moon);
  }

  planetObjects.push({
    data: p,
    pivot,
    mesh,
    angle: index * 0.8,
    moonOrbit
  });

  pickables.push(mesh);

  const button = document.createElement('button');
  button.className = 'planet-btn';
  button.innerHTML = `
    <span class="planet-dot"
      style="background:#${p.color.toString(16).padStart(6, '0')}"></span>
    <span>${p.name}</span>
  `;

  button.addEventListener('click', () => selectPlanet(index, true));
  planetList.appendChild(button);
});

// Interaction and camera
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();

let selectedIndex = 2;
let paused = false;
let timeSpeed = 1;
let focusTween = null;

function selectPlanet(index, focus = false) {
  selectedIndex = index;
  const p = planets[index];

  document.querySelectorAll('.planet-btn').forEach((button, i) => {
    button.classList.toggle('active', i === index);
  });

  $('planetName').textContent = p.name;
  $('planetType').textContent = p.type;
  $('description').textContent = p.desc;
  $('distance').textContent = (p.radius / 10).toFixed(1) + ' AU*';
  $('dayLength').textContent = p.day;
  $('moons').textContent = p.moons;
  $('diameter').textContent = p.diameter;

  const color = '#' + p.color.toString(16).padStart(6, '0');
  $('preview').style.background =
    `radial-gradient(circle at 30% 25%, white, ${color} 40%, #111528)`;
  $('preview').style.boxShadow = `0 0 30px ${color}66`;

  if (focus) focusPlanet();
}

function focusPlanet() {
  const obj = planetObjects[selectedIndex];
  const target = new THREE.Vector3();
  obj.mesh.getWorldPosition(target);

  const direction = new THREE.Vector3(1, 0.55, 1).normalize();
  const distance = Math.max(9, obj.data.size * 5.5);

  focusTween = {
    start: camera.position.clone(),
    end: target.clone().addScaledVector(direction, distance),
    lookStart: controls.target.clone(),
    lookEnd: target,
    elapsed: 0,
    duration: 1.1
  };
}

$('focusBtn').addEventListener('click', focusPlanet);

$('resetBtn').addEventListener('click', () => {
  focusTween = {
    start: camera.position.clone(),
    end: new THREE.Vector3(0, 42, 100),
    lookStart: controls.target.clone(),
    lookEnd: new THREE.Vector3(0, 0, 0),
    elapsed: 0,
    duration: 1
  };

  $('zoom').value = 100;
  $('zoomValue').textContent = '100%';
});

$('playBtn').addEventListener('click', () => {
  paused = !paused;
  $('playBtn').textContent = paused ? '▶' : 'Ⅱ';
  $('simStatus').textContent = paused ? 'Paused' : 'Simulation';
});

$('speed').addEventListener('input', event => {
  timeSpeed = Number(event.target.value);
  $('speedValue').textContent = timeSpeed.toFixed(1) + '×';
});

$('zoom').addEventListener('input', event => {
  const value = Number(event.target.value);
  $('zoomValue').textContent = value + '%';

  const direction = camera.position.clone()
    .sub(controls.target).normalize();

  camera.position.copy(controls.target)
    .addScaledVector(direction, 100 * 100 / value);
});

// Click a 3D planet to select it
canvas.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);

  if (hits.length) {
    selectPlanet(hits[0].object.userData.index, true);
  }
});

canvas.addEventListener('pointermove', event => {
  const rect = canvas.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  const tooltip = $('tooltip');

  if (hits.length) {
    canvas.style.cursor = 'pointer';
    tooltip.style.display = 'block';
    tooltip.style.left = event.clientX + 14 + 'px';
    tooltip.style.top = event.clientY + 14 + 'px';
    tooltip.textContent = planets[hits[0].object.userData.index].name;
  } else {
    canvas.style.cursor = 'grab';
    tooltip.style.display = 'none';
  }
});

// Main animation loop
function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const dt = paused ? 0 : delta * timeSpeed;

  if (!paused) {
    sun.rotation.y += dt * 0.06;
    stars.rotation.y += dt * 0.001;

    planetObjects.forEach(obj => {
      obj.angle += dt * obj.data.speed;
      obj.pivot.rotation.y = obj.angle;
      obj.mesh.rotation.y += dt * 0.25;

      if (obj.moonOrbit) {
        obj.moonOrbit.rotation.y += dt * 0.7;
      }
    });
  }

  if (focusTween) {
    focusTween.elapsed += delta;

    const t = Math.min(
      focusTween.elapsed / focusTween.duration, 1
    );
    const ease = t * t * (3 - 2 * t);

    camera.position.lerpVectors(
      focusTween.start, focusTween.end, ease
    );
    controls.target.lerpVectors(
      focusTween.lookStart, focusTween.lookEnd, ease
    );

    if (t >= 1) focusTween = null;
  }

  controls.update();
  renderer.render(scene, camera);
}

selectPlanet(selectedIndex);
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

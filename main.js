import {
  AmbientLight,
  BoxGeometry,
  Clock,
  Color,
  CylinderGeometry,
  HemisphereLight,
  Mesh,
  MeshNormalMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  MeshBasicMaterial
} from 'three';

// XR Emulator
import { DevUI } from '@iwer/devui';
import { XRDevice, metaQuest3 } from 'iwer';

// XR
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

async function setupXR(xrMode) {
  if (xrMode !== 'immersive-vr') return;
  let nativeWebXRSupport = false;
  if (navigator.xr) {
    nativeWebXRSupport = await navigator.xr.isSessionSupported(xrMode);
  }
  if (!nativeWebXRSupport) {
    const xrDevice = new XRDevice(metaQuest3);
    xrDevice.installRuntime();
    xrDevice.fovy = (75 / 180) * Math.PI;
    xrDevice.ipd = 0;
    window.xrdevice = xrDevice;
    xrDevice.controllers.right.position.set(0.15649, 1.43474, -0.38368);
    xrDevice.controllers.right.quaternion.set(
      0.14766305685043335,
      0.02471366710960865,
      -0.0037767395842820406,
      0.9887216687202454,
    );
    xrDevice.controllers.left.position.set(-0.15649, 1.43474, -0.38368);
    xrDevice.controllers.left.quaternion.set(
      0.14766305685043335,
      0.02471366710960865,
      -0.0037767395842820406,
      0.9887216687202454,
    );
    new DevUI(xrDevice);
  }
}

await setupXR('immersive-ar');

let camera, scene, renderer;
let controller;

const clock = new Clock();

let placingEnabled = false;
let playButton;
let audioBuffer;
let musicBuffer;
let listener;
let timerMesh;
let messageMesh;

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const loadAudio = () => {
  listener = new THREE.AudioListener();
  camera.add(listener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('public/play_sound_effect.mp3', (buffer) => {
    audioBuffer = buffer;
  });

  audioLoader.load('public/music.mp3', (buffer) => {
    musicBuffer = buffer;
  });
};

const playSound = () => {  
  const sound = new THREE.Audio(listener);
  sound.setBuffer(audioBuffer);
  sound.setLoop(false);
  sound.setVolume(0.5);
  sound.play();
};

const playMusic = () => {
  const music = new THREE.Audio(listener);
  music.setBuffer(musicBuffer);
  music.setLoop(true);
  music.setVolume(0.5);
  setTimeout(() => {
    music.play();
  }, 1000);
};

const createPlayButton = () => {
  const buttonGeometry = new BoxGeometry(0.2, 0.1, 0.05);
  const buttonMaterial = new MeshPhongMaterial({ color: 0xff0000 });
  playButton = new Mesh(buttonGeometry, buttonMaterial);

  const loader = new FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new TextGeometry('PLAY', {
      font: font,
      size: 0.05,
      height: 0.01,
    });
    const textMaterial = new MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new Mesh(textGeometry, textMaterial);
    textMesh.position.set(-0.08, -0.02, 0.03);
    playButton.add(textMesh);
  });
};

const createTimerText = (text) => {
  const loader = new FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: 0.05,
      height: 0.01,
    });
    const textMaterial = new MeshBasicMaterial({ color: 0xffffff });
    timerMesh = new Mesh(textGeometry, textMaterial);
    timerMesh.position.set(-0.1, 1.1, -1);
    scene.add(timerMesh);
  });
};

const updateTimerText = (text) => {
  if (timerMesh) {
    scene.remove(timerMesh);
  }
  createTimerText(text);
};

const startTimer = (duration) => {
  let timer = duration, minutes, seconds;
  const interval = setInterval(() => {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    updateTimerText(minutes + ":" + seconds);

    if (--timer < 0) {
      clearInterval(interval);
      alert('Time is up!');
    }
  }, 1000);
};

const displayMessage = (message) => {
  if (messageMesh) {
    scene.remove(messageMesh);
  }
  const loader = new FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new TextGeometry(message, {
      font: font,
      size: 0.05,
      height: 0.01,
    });
    const textMaterial = new MeshBasicMaterial({ color: 0xffffff });
    messageMesh = new Mesh(textGeometry, textMaterial);
    messageMesh.position.set(-0.2, 1.2, -1);
    scene.add(messageMesh);
  });
};

const checkButtonClick = (event) => {
  if (!playButton) return;
  
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersects = raycaster.intersectObject(playButton);
  if (intersects.length > 0) {
    placingEnabled = true;
    breakPlayButton();
    playSound();
    playMusic();
    const bodyParts = ['head', 'shoulder', 'knee', 'toe', 'eye', 'ear', 'nose', 'mouth', 'hand', 'foot'];
    const randomIndex = Math.floor(Math.random() * bodyParts.length);
    displayMessage('Draw a ' + bodyParts[randomIndex] + '!');
    startTimer(60);
  }
};

const breakPlayButton = () => {
  const pieces = [];
  const pieceGeometry = new BoxGeometry(0.05, 0.05, 0.05);
  const pieceMaterial = new MeshPhongMaterial({ color: 0xff0000 });

  for (let i = 0; i < 12; i++) {
    const piece = new Mesh(pieceGeometry, pieceMaterial);
    piece.position.copy(playButton.position);
    scene.add(piece);
    pieces.push(piece);

    const shape = new CANNON.Box(new CANNON.Vec3(0.025, 0.025, 0.025));
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.copy(piece.position);
    body.quaternion.copy(piece.quaternion);
    world.addBody(body);

    body.applyImpulse(new CANNON.Vec3(Math.random() - 0.5, Math.random(), Math.random() - 0.5).scale(1.5), body.position);

    piece.userData.body = body;
  }

  scene.remove(playButton);
  playButton = null;
};

const onSelect = (event) => {
  if (!placingEnabled) return;

  const material = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
  const mesh = new Mesh(new THREE.SphereGeometry(0.04, 32, 32), material);
  mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
  mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
  scene.add(mesh);
};

const animate = () => {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  world.step(delta);

  scene.children.forEach((child) => {
    if (child.userData.body) {
      child.position.copy(child.userData.body.position);
      child.quaternion.copy(child.userData.body.quaternion);
    }
  });

  if (playButton) {
    playButton.position.set(0, -0.2, -0.5).applyMatrix4(camera.matrixWorld);
    playButton.quaternion.copy(camera.quaternion);
  }

  renderer.render(scene, camera);
};

const init = () => {
  scene = new Scene();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new PerspectiveCamera(75, aspect, 0.1, 10);
  camera.position.set(0, 1.6, 3);

  const light = new AmbientLight(0xffffff, 1.0);
  scene.add(light);

  const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
  hemiLight.position.set(0.5, 1, 0.25);
  scene.add(hemiLight);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const xrButton = XRButton.createButton(renderer, {});
  xrButton.style.backgroundColor = 'skyblue';
  document.body.appendChild(xrButton);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, 0);
  controls.update();

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  controller.addEventListener('select', checkButtonClick);
  scene.add(controller);

  createPlayButton();
  loadAudio();

  window.addEventListener('resize', onWindowResize, false);

  renderer.xr.addEventListener('sessionstart', () => {
    scene.add(playButton);
  });
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

init();
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
  WebGLRenderer
} from 'three';

// XR Emulator
import { DevUI } from '@iwer/devui';
import { XRDevice, metaQuest3 } from 'iwer';

// XR
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Font, FontLoader } from 'three/examples/jsm/Addons.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { MeshBasicMaterial } from 'three/examples/jsm/materials/MeshBasicMaterial.js';

import * as THREE from 'three';

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

let placingEnabled = false; // Drapeau pour activer/désactiver le placement
let playButton;

// Fonction pour créer un bouton "Play"
const createPlayButton = () => {
  const buttonGeometry = new BoxGeometry(0.2, 0.1, 0.05);
  const buttonMaterial = new MeshPhongMaterial({ color: 0xff0000 });
  playButton = new Mesh(buttonGeometry, buttonMaterial);
  playButton.position.set(0, 0, -0.5); // Place initialement devant la caméra
  scene.add(playButton);
};

const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
  const textGeometry = new TextGeometry('Play', {
    font: font,
    size: 0.05,
    depth: 0.01,
  });
  const textMaterial = new MeshBasicMaterial({ color: 0xffffff });
  const textMesh = new Mesh(textGeometry, textMaterial);
  textMesh.position.set(-0.06, -0.02, 0.03);
  playButton.add(textMesh);
});

// Détecte le clic sur le bouton
const checkButtonClick = (event) => {
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

  const intersects = raycaster.intersectObject(playButton);
  if (intersects.length > 0) {
    // Activer la fonctionnalité et désactiver le bouton
    placingEnabled = true;
    scene.remove(playButton);
  }
};

// Modifiez la fonction `onSelect` pour ne placer des cônes que si `placingEnabled` est activé
const onSelect = (event) => {
  if (!placingEnabled) return;

  const material = new MeshPhongMaterial({ color: 0xffffff * Math.random() });
  const mesh = new Mesh(new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2), material);
  mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
  mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
  scene.add(mesh);
};

// Modifiez la fonction `animate` pour que le bouton suive la caméra
const animate = () => {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (playButton) {
    // Maintient le bouton "Play" devant la caméra
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

  window.addEventListener('resize', onWindowResize, false);
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

init();
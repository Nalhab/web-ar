import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

class MenuUI {
    constructor(camera, scene, onGameStart) {
        this.onGameStart = onGameStart;
        this.menuGroup = new THREE.Group();
        this.menuGroup.position.set(0, 1.6, -2);
        this.camera = camera;
        
        const buttonGeometry = new THREE.PlaneGeometry(0.8, 0.4);
        const buttonMaterial = new THREE.MeshBasicMaterial({
            color: 0x4CAF50,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.playButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
        
        // Création du texte
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; // Augmenter la résolution
        canvas.height = 256;
        context.fillStyle = 'white';
        context.font = 'bold 64px Arial'; // Police plus grande et en gras
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('PLAY', canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const textPlane = new THREE.PlaneGeometry(0.6, 0.3);
        const textMesh = new THREE.Mesh(textPlane, textMaterial);
        textMesh.position.set(0, 0, 0.001);

        this.playButton.add(textMesh);
        this.menuGroup.add(this.playButton);
        scene.add(this.menuGroup);
        scene.add(this.playButton);
        
        this.isMenuActive = true;

        this.update = () => {
            if (this.isMenuActive) {
                this.menuGroup.lookAt(camera.position);
            }
        };

        this.setupXRControllers(scene);
    }

    setupXRControllers(scene) {
        if (!window.renderer) return;
        
        // Contrôleur droit
        this.controller = window.renderer.xr.getController(0);
        this.controller.addEventListener('select', () => {
            if (!this.isMenuActive) return;
    
            // Utiliser la même méthode que pour les cônes
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(this.controller.matrixWorld);
            
            // Position du rayon depuis le contrôleur
            const raycaster = new THREE.Raycaster();
            const rayOrigin = new THREE.Vector3();
            rayOrigin.setFromMatrixPosition(this.controller.matrixWorld);
            
            // Direction du rayon (avant du contrôleur)
            const rayDirection = new THREE.Vector3(0, 0, -1);
            rayDirection.applyMatrix4(tempMatrix);
            
            raycaster.set(rayOrigin, rayDirection);
            
            // Debug
            console.log('Controller position:', rayOrigin);
            console.log('Ray direction:', rayDirection);
            
            const intersects = raycaster.intersectObject(this.playButton, true);
            
            if (intersects.length > 0) {
                console.log('Menu hit at distance:', intersects[0].distance);
                this.startGame();
            }
        });
        scene.add(this.controller);
    
        // Ligne de visée plus visible pour debug
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -10) // Plus longue ligne
        ]);
        
        const material = new THREE.LineBasicMaterial({
            color: 0xff0000,
            linewidth: 2
        });
        
        const line = new THREE.Line(geometry, material);
        this.controller.add(line);

        this.setupInteractions();
    }
  
    setupInteractions() {
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
    
        const handleInteraction = (clientX, clientY) => {
            if (!this.isMenuActive) return;
    
            try {
                pointer.x = (clientX / window.innerWidth) * 2 - 1;
                pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    
                raycaster.setFromCamera(pointer, this.camera);
                const intersects = raycaster.intersectObjects([this.playButton], true);
    
                console.log('Interaction detected', intersects.length);
    
                if (intersects.length > 0) {
                    console.log('Hit detected');
                    this.startGame();
                }
            } catch (error) {
                console.error('Error in interaction handler:', error);
            }
        };
    
        // Gestion des clics souris
        window.addEventListener('click', (event) => {
            handleInteraction(event.clientX, event.clientY);
        });
    
        // Gestion des événements tactiles
        window.addEventListener('touchstart', (event) => {
            event.preventDefault(); // Empêche le double événement sur certains navigateurs
            const touch = event.touches[0];
            handleInteraction(touch.clientX, touch.clientY);
        });
    }
  
    startGame() {
        this.isMenuActive = false;
        this.menuGroup.visible = false;
        if (this.onGameStart) {
            this.onGameStart();
        }
    }
  
    isDrawingAllowed() {
        return !this.isMenuActive;
    }
}

export { MenuUI };
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

export class EngravedTextExample {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private material: THREE.MeshStandardMaterial;

    constructor(container: HTMLElement) {
        // Initialize scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        // Create material
        this.material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            metalness: 0.7,
            roughness: 0.3,
        });

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Load font and create engraved text
        this.loadFontAndCreateText();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start animation loop
        this.animate();
    }

    private async loadFontAndCreateText() {
        const fontLoader = new FontLoader();
        
        try {
            const font = await fontLoader.loadAsync('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json');
            
            // Create base plate
            const baseGeometry = new THREE.BoxGeometry(4, 2, 0.5);
            const baseMesh = new THREE.Mesh(baseGeometry, this.material);
            
            // Create text geometry
            const textGeometry = new TextGeometry('CSG', {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });
            
            // Center the text geometry
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
            const textHeight = textGeometry.boundingBox!.max.y - textGeometry.boundingBox!.min.y;
            textGeometry.translate(-textWidth / 2, -textHeight / 2, 0);
            
            // Create text mesh
            const textMesh = new THREE.Mesh(textGeometry, this.material);
            textMesh.position.z = 0.3; // Move text slightly forward
            
            // Perform CSG subtraction
            const result = CSG.subtract(baseMesh, textMesh);
            
            // Add the result to the scene
            this.scene.add(result);
            
            // Add some rotation for better visualization
            result.rotation.x = -0.2;
            result.rotation.y = 0.3;
            
        } catch (error) {
            console.error('Error loading font:', error);
        }
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
} 
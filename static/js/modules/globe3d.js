/* ═══════════════════════════════════════════
   GodEyes – globe3d.js
   Three.js 3D Globe & Satellite Tracking
   ═══════════════════════════════════════════ */

class Globe3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.satellites = [];
        this.init();
    }

    init() {
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);
        
        this.camera.position.z = 500;
        
        // Earth Sphere
        const geometry = new THREE.SphereGeometry(200, 64, 64);
        const texture = new THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
        const material = new THREE.MeshPhongMaterial({ map: texture });
        this.earth = new THREE.Mesh(geometry, material);
        this.scene.add(this.earth);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(5, 3, 5);
        this.scene.add(sunLight);
        
        this.animate();
        this.fetchSatellites();
    }

    async fetchSatellites() {
        try {
            const response = await fetch('/api/satellites/tle');
            const data = await response.json();
            this.plotSatellites(data);
        } catch (error) {
            console.error('Error fetching satellites:', error);
        }
    }

    plotSatellites(satData) {
        satData.forEach(sat => {
            const geometry = new THREE.SphereGeometry(2, 8, 8);
            const color = sat.type === 'iss' ? 0x00ffff : (sat.type === 'starlink' ? 0xffffff : 0x00ff00);
            const material = new THREE.MeshBasicMaterial({ color: color });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Initial position (simplified)
            mesh.position.set(Math.random() * 400 - 200, Math.random() * 400 - 200, Math.random() * 400 - 200);
            this.scene.add(mesh);
            this.satellites.push({ mesh, tle: sat });
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.earth.rotation.y += 0.002;
        this.renderer.render(this.scene, this.camera);
    }
}

window.globe3D = new Globe3D('globe-container');

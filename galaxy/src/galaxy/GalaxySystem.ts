import * as THREE from 'three';
import { GalaxyType } from '../utils/colorUtils';
import { createParticle, type Particle } from './Particle';

const MAX_PARTICLES = 6000;
const DUST_PARTICLES = 3000;
const BG_PARTICLES = 2000;
const MORPH_SPEED = 2.0;

function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
}

// Removed createCloudTexture

const vertexShader = `
  uniform float uTime;
  attribute float aSize;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Twinkling effect calculated per particle
    float sizeMultiplier = 1.0 + 0.3 * sin(uTime * 2.0 + aPhase);
    vAlpha = 0.6 + 0.4 * sin(uTime * 1.5 + aPhase);
    
    // Increased base multiplier so points aren't too small
    gl_PointSize = aSize * sizeMultiplier * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D pointTexture;
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
    gl_FragColor = vec4(vColor, texColor.a * vAlpha);
  }
`;

export class GalaxySystem {
    private particles: Particle[] = [];
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;
    public group: THREE.Group;

    private points: THREE.Points;
    private bgPoints: THREE.Points;
    private dustPoints: THREE.Points;

    private currentType: GalaxyType = GalaxyType.SPIRAL;

    constructor() {
        this.group = new THREE.Group();

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                pointTexture: { value: createStarTexture() }
            },
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        // Cloud layer removed.
        // --- 1. Core Galaxy Particles (Dynamic Morphing Layer) ---
        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(MAX_PARTICLES * 3);
        const colors = new Float32Array(MAX_PARTICLES * 3);
        const sizes = new Float32Array(MAX_PARTICLES);
        const phases = new Float32Array(MAX_PARTICLES);

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = createParticle();
            this.particles.push(p);

            p.position.set(0, 0, 0);
            p.targetPosition.copy(p.position);

            sizes[i] = Math.random() * 0.3 + 0.05; // Slightly reduced core star size to thin out the giant blob
            phases[i] = Math.random() * Math.PI * 2;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

        this.points = new THREE.Points(this.geometry, this.material);
        this.group.add(this.points);


        // --- 2. Background Stars Layer ---
        const bgGeo = new THREE.BufferGeometry();
        const bgPos = new Float32Array(BG_PARTICLES * 3);
        const bgCol = new Float32Array(BG_PARTICLES * 3);
        const bgSize = new Float32Array(BG_PARTICLES);
        const bgPhase = new Float32Array(BG_PARTICLES);

        for (let i = 0; i < BG_PARTICLES; i++) {
            const r = 20 + Math.random() * 30; // Far out from center
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            bgPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            bgPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            bgPos[i * 3 + 2] = r * Math.cos(phi);

            bgCol[i * 3] = 0.5 + Math.random() * 0.5;
            bgCol[i * 3 + 1] = 0.5 + Math.random() * 0.5;
            bgCol[i * 3 + 2] = 0.8 + Math.random() * 0.2;

            bgSize[i] = Math.random() * 0.15 + 0.05;
            bgPhase[i] = Math.random() * Math.PI * 2;
        }
        bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
        bgGeo.setAttribute('color', new THREE.BufferAttribute(bgCol, 3));
        bgGeo.setAttribute('aSize', new THREE.BufferAttribute(bgSize, 1));
        bgGeo.setAttribute('aPhase', new THREE.BufferAttribute(bgPhase, 1));

        this.bgPoints = new THREE.Points(bgGeo, this.material);
        this.group.add(this.bgPoints);


        // --- 3. Cosmic Dust Layer ---
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = new Float32Array(DUST_PARTICLES * 3);
        const dustCol = new Float32Array(DUST_PARTICLES * 3);
        const dustSize = new Float32Array(DUST_PARTICLES);
        const dustPhase = new Float32Array(DUST_PARTICLES);

        for (let i = 0; i < DUST_PARTICLES; i++) {
            const r = Math.pow(Math.random(), 2) * 12;
            const theta = Math.random() * Math.PI * 2;
            const yDist = (Math.random() - 0.5) * 3;

            dustPos[i * 3] = r * Math.cos(theta);
            dustPos[i * 3 + 1] = yDist;
            dustPos[i * 3 + 2] = r * Math.sin(theta);

            let brightness = 0.1 + (1 - r / 12) * 0.2;
            dustCol[i * 3] = brightness;
            dustCol[i * 3 + 1] = brightness * 0.8;
            dustCol[i * 3 + 2] = brightness * 1.2;

            dustSize[i] = Math.random() * 0.2 + 0.1;
            dustPhase[i] = Math.random() * Math.PI * 2;
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
        dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
        dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(dustPhase, 1));

        this.dustPoints = new THREE.Points(dustGeo, this.material);
        this.group.add(this.dustPoints);

        this.generateGalaxy(GalaxyType.NEBULA, 0, 0.5, 0.5);
    }

    public updateParameters(type: GalaxyType, hue: number, saturation: number, brightness: number) {
        if (this.currentType !== type) {
            this.currentType = type;
            this.generateGalaxy(type, hue, saturation, brightness);
        } else {
            this.updateColors(hue, saturation, brightness);
        }
    }

    private updateColors(hue: number, saturation: number, brightness: number) {
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = this.particles[i];
            const radius = p.targetPosition.length();

            let h = hue + (Math.random() - 0.5) * 0.15;
            let s = saturation;
            let l = brightness;

            // Make the core have distinct structure instead of a giant solid sphere
            if (radius < 2.0) {
                // Less overwhelmingly bright core. Just intense color with slightly higher lightness.
                h -= 0.05;
                s = Math.max(0.4, s - 0.2);
                l = Math.min(0.8, l + 0.2);
            } else if (radius < 6.0) {
                l = Math.min(0.9, l + 0.1);
            } else {
                h += 0.1;
                s += 0.2;
                l = l * 0.5;
            }

            p.targetColor.setHSL(h, Math.min(1, s), Math.max(0, l));
        }

        // Could layer colors removed.
    }

    private generateGalaxy(type: GalaxyType, hue: number, saturation: number, brightness: number) {
        const arms = 4;
        const maxRadius = 10;

        const turbulence = Math.max(0.5, saturation * 3);
        const density = Math.min(1.0, Math.max(0.2, brightness * 1.5));
        const activeParticles = Math.floor(MAX_PARTICLES * density);

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = this.particles[i];

            if (i >= activeParticles) {
                p.targetPosition.set(0, 0, 0);
                continue;
            }

            // Avoid creating a monolithic sphere in the center by spreading out radius distribution slightly
            const powBias = 1.3 + Math.random() * 0.5; // less aggressive packing at 0, spread more evenly
            const radius = Math.pow(Math.random(), powBias) * maxRadius + 0.2; // +0.2 hollows the actual dead center

            let spin = 1.0;
            switch (type) {
                case GalaxyType.NEBULA: spin = 0.2; break;
                case GalaxyType.STARBURST: spin = 0.0; break;
                case GalaxyType.CLUSTER: spin = 0.6; break;
                case GalaxyType.SPIRAL: spin = 1.0; break;
                case GalaxyType.ELLIPTICAL: spin = 1.8; break;
                case GalaxyType.DISTORTED: spin = -1.2; break;
            }

            const branchAngle = (i % arms) * ((Math.PI * 2) / arms);
            const angle = branchAngle + radius * spin;

            const powNoise = Math.pow(Math.random(), 2);
            const signX = Math.random() < 0.5 ? 1 : -1;
            const signY = Math.random() < 0.5 ? 1 : -1;
            const signZ = Math.random() < 0.5 ? 1 : -1;

            const noiseScale = powNoise * turbulence * (radius / maxRadius + 0.1);

            const randomX = signX * noiseScale * 1.5;
            const randomY = signY * noiseScale * 0.4;
            const randomZ = signZ * noiseScale * 1.5;

            p.targetPosition.set(
                Math.cos(angle) * radius + randomX,
                randomY,
                Math.sin(angle) * radius + randomZ
            );
        }

        this.updateColors(hue, saturation, brightness);
    }

    public update(deltaTime: number, time: number) {
        const positions = this.geometry.attributes.position.array as Float32Array;
        const colors = this.geometry.attributes.color.array as Float32Array;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = this.particles[i];

            p.position.lerp(p.targetPosition, deltaTime * MORPH_SPEED);
            p.color.lerp(p.targetColor, deltaTime * MORPH_SPEED * 2);

            positions[i * 3] = p.position.x;
            positions[i * 3 + 1] = p.position.y;
            positions[i * 3 + 2] = p.position.z;

            colors[i * 3] = p.color.r;
            colors[i * 3 + 1] = p.color.g;
            colors[i * 3 + 2] = p.color.b;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;

        // Shader Uniform Update for GPU Twinkling
        this.material.uniforms.uTime.value = time;

        // Layered Rotation
        this.points.rotation.y += deltaTime * 0.05;
        this.dustPoints.rotation.y += deltaTime * 0.08;
        this.bgPoints.rotation.y += deltaTime * 0.01;
    }
}

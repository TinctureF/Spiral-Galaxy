import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { WebcamColorSampler } from './camera/WebcamColorSampler';
import { rgbToHsl, getGalaxyTypeFromHue } from './utils/colorUtils';
import { GalaxySystem } from './galaxy/GalaxySystem';

const container = document.getElementById('app');
const hueFill = document.getElementById('hue-fill');
const hueKnob = document.getElementById('hue-knob');
const satFill = document.getElementById('sat-fill');
const satKnob = document.getElementById('sat-knob');
const lumFill = document.getElementById('lum-fill');
const lumKnob = document.getElementById('lum-knob');
const colorIndicator = document.getElementById('color-indicator');
const typeLabel = document.getElementById('type-label');

// Three.js setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.02); // Deep dark background with subtle fog

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimization
renderer.setClearColor(0x000000, 0); // Transparent background to show pure CSS atmosphere underneath
container?.appendChild(renderer.domElement);

// Post Processing Setup (Bloom Pass)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1; // only bloom brighter pixels
bloomPass.strength = 0.6; // Reduced from 1.0 to retain inner details
bloomPass.radius = 0.3; // Reduced spread

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Initialization
const sampler = new WebcamColorSampler();
const galaxy = new GalaxySystem();
scene.add(galaxy.group);

// Zoom mechanics utilizing mouse wheel
let targetZoom = 16;
let currentZoom = 16;
let targetHeight = 5;
let currentHeight = 5;

window.addEventListener('wheel', (e) => {
  // Translate wheel delta to zoom radius
  targetZoom += e.deltaY * 0.015;
  targetZoom = Math.max(4, Math.min(targetZoom, 40)); // Limits out-zoom to 40, in-zoom to 4

  // Proportional height sway
  targetHeight += e.deltaY * 0.005;
  targetHeight = Math.max(1, Math.min(targetHeight, 15));
});

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

async function init() {
  await sampler.start();

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = performance.now() * 0.001;
    const deltaTime = clock.getDelta();

    // Sample webcam periodically
    sampler.sample(performance.now());
    const { r, g, b } = sampler.currentColor;

    // Convert to HSL
    const { h, s, l } = rgbToHsl(r, g, b);

    // Determine Galaxy type
    const galaxyType = getGalaxyTypeFromHue(h);

    // Update galaxy physics and morphing
    galaxy.updateParameters(galaxyType, h, s, Math.max(0.2, l));
    galaxy.update(deltaTime, time);

    // Smooth camera zoom updates
    currentZoom += (targetZoom - currentZoom) * 0.1;
    currentHeight += (targetHeight - currentHeight) * 0.1;

    // Slow cinematic orbital camera movement 
    camera.position.x = Math.sin(time * 0.05) * currentZoom;
    camera.position.z = Math.cos(time * 0.05) * currentZoom;
    camera.position.y = currentHeight + Math.sin(time * 0.03) * 1.5;
    camera.lookAt(0, 0, 0);

    // Modern Glassmorphism UI Update
    if (colorIndicator && typeLabel) {
      if (hueFill && hueKnob) {
        hueFill.style.height = `${h * 100}%`;
        hueKnob.style.bottom = `${h * 100}%`;
        // Dynamically tint the gradient
        hueFill.style.background = `linear-gradient(to top, hsla(${h * 360}, 60%, 50%, 0.5), transparent)`;
      }
      if (satFill && satKnob) {
        satFill.style.height = `${s * 100}%`;
        satKnob.style.bottom = `${s * 100}%`;
      }
      if (lumFill && lumKnob) {
        // Add a small baseline to l so the bar isn't totally empty if brightness is low
        const lumClamp = Math.max(0.05, l);
        lumFill.style.height = `${lumClamp * 100}%`;
        lumKnob.style.bottom = `${lumClamp * 100}%`;
      }

      const colorStr = `rgb(${r}, ${g}, ${b})`;
      colorIndicator.style.backgroundColor = colorStr;
      colorIndicator.style.boxShadow = `0 0 25px ${colorStr}`;
      typeLabel.innerText = galaxyType;
    }

    composer.render();
  }

  animate();
}

init();

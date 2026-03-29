import * as THREE from 'three';

export interface Particle {
    position: THREE.Vector3;
    targetPosition: THREE.Vector3;
    velocity: THREE.Vector3;
    color: THREE.Color;
    targetColor: THREE.Color;
    size: number;
}

export function createParticle(): Particle {
    return {
        position: new THREE.Vector3(),
        targetPosition: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        targetColor: new THREE.Color(),
        size: Math.random() * 0.5 + 0.1
    };
}

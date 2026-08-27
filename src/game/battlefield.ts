import * as THREE from "three";

import type { BattleSnapshot } from "../domain/snapshot";

export type Battlefield = {
  render(snapshot: BattleSnapshot): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

export const createBattlefield = (host: HTMLElement): Battlefield => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07121f");
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2, 7);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.className = "battlefield-canvas";
  host.append(renderer.domElement);
  const light = new THREE.DirectionalLight("#f8d28b", 2);
  light.position.set(2, 4, 3);
  scene.add(light, new THREE.HemisphereLight("#75c7ff", "#25120b", 1.5));
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(4, 32),
    new THREE.MeshStandardMaterial({ color: "#172c35", roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const player = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.7),
    new THREE.MeshStandardMaterial({ color: "#4de1c1", emissive: "#0d443d" }),
  );
  player.position.x = -1.7;
  scene.add(player);
  const enemy = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.7),
    new THREE.MeshStandardMaterial({ color: "#ff9d66", emissive: "#4d180d" }),
  );
  enemy.position.x = 1.7;
  scene.add(enemy);
  const disposeObject = (object: THREE.Object3D): void =>
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material.dispose();
      }
    });
  return {
    render: () => renderer.render(scene, camera),
    resize: (width, height) => {
      const safeWidth = Math.max(width, 1);
      const safeHeight = Math.max(height, 1);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(safeWidth, safeHeight, false);
    },
    dispose: () => {
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
};

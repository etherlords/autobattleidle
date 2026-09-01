import * as THREE from "three";

export const LAB_RECIPES = ["production", "socket-probe"] as const;
export type LabRecipe = "production" | "socket-probe";

export const attachLabRecipe = (recipe: LabRecipe, unit: THREE.Object3D): (() => void) => {
  if (recipe === "production") return () => undefined;
  let target: THREE.Object3D = unit;
  unit.traverse((node) => {
    if (node.name.endsWith("-top")) target = node;
  });
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.12),
    new THREE.MeshBasicMaterial({ color: "#ff4fd8", wireframe: true }),
  );
  mesh.name = "lab-candidate-socket-probe";
  target.add(mesh);
  return () => {
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh.removeFromParent();
  };
};

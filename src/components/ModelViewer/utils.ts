import * as THREE from "three";

/** Calculate depth of a node relative to root in the scene graph */
export function getDepth(node: THREE.Object3D, root: THREE.Object3D): number {
  let depth = 0;
  let current = node.parent;
  while (current && current !== root) {
    depth++;
    current = current.parent;
  }
  return depth;
}

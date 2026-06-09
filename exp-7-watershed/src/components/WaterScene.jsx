import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../region_animation.css";
const VoxelScene = ({
  binaryMap,
  maxY = 1,
  waterLevel = 1,
  currentStep = 0,
}) => {
  const mountRef = useRef(null);
  // Keep references to animate objects in the clock-based loop
  const terrainMeshesRef = useRef([]);
  const waterMeshesRef = useRef([]);
  const edgeMeshesRef = useRef([]);

  useEffect(() => {
    if (!binaryMap || !binaryMap.length) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(10, 12, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const rows = binaryMap.length;
    const cols = binaryMap[0].length;

    const brightColors = [
      0x00ff00, 0xffa500, 0xff0000, 0xffff00, 0x00ffff, 0xff00ff,
    ];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const terrainHeights = [];

    for (let y = 0; y < rows; y++) {
      terrainHeights[y] = [];
      for (let x = 0; x < cols; x++) {
        const value = binaryMap[y][x];
        const cappedHeight = Math.min(value, maxY);
        terrainHeights[y][x] = cappedHeight;

        if (value === 1) {
          const voxelMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
          const voxel = new THREE.Mesh(boxGeo, voxelMat);
          voxel.position.set(
            x - cols / 2 + 0.5,
            cappedHeight / 2,
            y - rows / 2 + 0.5,
          );
          scene.add(voxel);
        }

        // edge drawing
        if (currentStep >= 2) {
          for (let h = 0; h < cappedHeight; h++) {
            const isZeroNeighbor = (i, j) => {
              return (
                j >= 0 &&
                j < rows &&
                i >= 0 &&
                i < cols &&
                binaryMap[j][i] === 0
              );
            };

            const directions = [
              [-1, 0, Math.PI / 2], // left
              [1, 0, -Math.PI / 2], // right
              [0, -1, 0], // top
              [0, 1, Math.PI], // bottom
            ];

            const baseX = x - cols / 2 + 0.5;
            const baseY = h + 0.5;
            const baseZ = y - rows / 2 + 0.5;

            const edgeMat = new THREE.LineBasicMaterial({ color: 0xff0000 });

            directions.forEach(([dx, dy, rotY]) => {
              const nx = x + dx;
              const ny = y + dy;

              if (isZeroNeighbor(nx, ny)) {
                const edgeGeo = new THREE.EdgesGeometry(
                  new THREE.PlaneGeometry(1, 1),
                );
                const edge = new THREE.LineSegments(edgeGeo, edgeMat);

                edge.rotation.y = rotY;
                edge.position.set(baseX + dx * 0.5, baseY, baseZ + dy * 0.5);

                scene.add(edge);
              }
            });
          }
        }
      }
    }
    //water fill
    const waterBoxes = [];
    if (currentStep >= 1) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const terrainHeight = terrainHeights[y][x];
          const fullWaterHeight = Math.max(
            0,
            Math.min(waterLevel, maxY) - terrainHeight,
          );
          if (fullWaterHeight > 0) {
            const waterGeo = new THREE.BoxGeometry(1, fullWaterHeight, 1);
            const waterMat = new THREE.MeshStandardMaterial({
              color: 0x33ccff,
              transparent: true,
              opacity: 0.6,
              roughness: 0.1,
              metalness: 0.4,
            });

            const waterMesh = new THREE.Mesh(waterGeo, waterMat);
            waterMesh.position.set(
              x - cols / 2 + 0.5,
              terrainHeight + fullWaterHeight / 2,
              y - rows / 2 + 0.5,
            );
            if (currentStep === 1) {
              waterMesh.scale.y = 0.001;
            } else {
              waterMesh.scale.y = 1;
            }
            waterMesh.userData.targetHeight = fullWaterHeight;
            scene.add(waterMesh);
            waterBoxes.push({
              mesh: waterMesh,
              x,
              y,
              terrainHeight,
              fullWaterHeight,
            });
          }
        }
      }
    }

    // Floor
    const floorGeo = new THREE.PlaneGeometry(cols + 2, rows + 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      side: THREE.DoubleSide,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8e44ad });
    const wallHeight = maxY + 2;
    const wallThickness = 0.2;

    const wallGeoX = new THREE.BoxGeometry(wallThickness, wallHeight, rows + 2);
    const wallGeoZ = new THREE.BoxGeometry(cols + 2, wallHeight, wallThickness);

    const walls = [
      new THREE.Mesh(wallGeoX, wallMat),
      new THREE.Mesh(wallGeoX, wallMat),
      new THREE.Mesh(wallGeoZ, wallMat),
      new THREE.Mesh(wallGeoZ, wallMat),
    ];

    walls[0].position.set(-cols / 2 - 1, wallHeight / 2, 0);
    walls[1].position.set(cols / 2 + 1, wallHeight / 2, 0);
    walls[2].position.set(0, wallHeight / 2, -rows / 2 - 1);
    walls[3].position.set(0, wallHeight / 2, rows / 2 + 1);

    walls.forEach((w) => scene.add(w));

    const clock = new THREE.Clock();
    const riseSpeed = 0.5;

    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();

      if (currentStep >= 1) {
        waterBoxes.forEach(({ mesh, terrainHeight, fullWaterHeight }) => {
          if (mesh.scale.y < 1) {
            mesh.scale.y += riseSpeed * delta;
            mesh.scale.y = Math.min(mesh.scale.y, 1);
            mesh.position.y =
              terrainHeight + (mesh.scale.y * fullWaterHeight) / 2;
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.dispose();
      controls.dispose();

      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [binaryMap, maxY, waterLevel, currentStep]);

  return <div ref={mountRef} id="water_shed" />;
};

export default VoxelScene;

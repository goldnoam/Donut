import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { DonutShape, Topping, Sprinkles, DonutConfig, Filling, DoughFlavor } from '../types';
import * as THREE from 'three';

interface Donut3DProps {
  config: DonutConfig;
  scale?: number;
  isPaused?: boolean;
}

const getDoughColor = (dough: DoughFlavor) => {
  switch (dough) {
    case DoughFlavor.CHOCOLATE: return "#5D4037";
    case DoughFlavor.RED_VELVET: return "#8B0000";
    case DoughFlavor.MATCHA: return "#7CB342";
    case DoughFlavor.CLASSIC: default: return "#EBC88E";
  }
};

const getToppingColor = (topping: Topping) => {
  switch (topping) {
    case Topping.CHOCOLATE: return "#3E2723";
    case Topping.PINK_GLAZE: return "#F48FB1";
    case Topping.WHITE_GLAZE: return "#F5F5F5";
    default: return null;
  }
};

const getFillingColor = (filling: Filling) => {
    switch (filling) {
        case Filling.STRAWBERRY: return "#D32F2F";
        case Filling.CUSTARD: return "#FFF176";
        case Filling.CHOCOLATE: return "#5D4037";
        case Filling.BLUEBERRY: return "#3F51B5";
        case Filling.LEMON: return "#FFEB3B";
        default: return null;
    }
}

const SprinklesMesh: React.FC<{ shape: DonutShape; type: Sprinkles }> = ({ shape, type }) => {
  const count = 120;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Memoize geometry/material creation to avoid re-creating on every render
  const geometry = useMemo(() => {
     if (type === Sprinkles.GOLD) return new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8); // Coin-ish
     return new THREE.CapsuleGeometry(0.04, 0.12, 4, 8);
  }, [type]);

  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempObj = new THREE.Object3D();
    
    // Define color palettes
    let colors: number[] = [];
    if (type === Sprinkles.RAINBOW) colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];
    else if (type === Sprinkles.CHOCOLATE) colors = [0x3E2723, 0x5D4037, 0x4E342E];
    else if (type === Sprinkles.BLUE_WHITE) colors = [0x2196F3, 0xFFFFFF, 0xBBDEFB]; // Hanukkah
    else if (type === Sprinkles.GOLD) colors = [0xFFD700, 0xFFC107, 0xFFEB3B];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      let radius, y, x, z;

      if (shape === DonutShape.RING) {
         const tubeRadius = 0.45;
         const mainRadius = 1;
         const tubeAngle = (Math.random() * Math.PI) / 1.5 - (Math.PI / 3) + (Math.PI/2);
         x = (mainRadius + tubeRadius * Math.cos(tubeAngle)) * Math.cos(angle);
         z = (mainRadius + tubeRadius * Math.cos(tubeAngle)) * Math.sin(angle);
         y = tubeRadius * Math.sin(tubeAngle);
      } else {
          const r = 1.05;
          const phi = Math.acos( -1 + ( 2 * Math.random() ) );
          const theta = Math.sqrt( count * Math.PI ) * phi;
          const u = Math.random();
          const v = Math.random();
          const thetaSph = 2 * Math.PI * u;
          const phiSph = Math.acos(2 * v - 1);
          x = r * Math.sin(phiSph) * Math.cos(thetaSph);
          z = r * Math.sin(phiSph) * Math.sin(thetaSph);
          y = Math.abs(r * Math.cos(phiSph) * 0.6);
      }

      tempObj.position.set(x, y, z);
      tempObj.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      
      const scaleVar = Math.random() * 0.5 + 0.8;
      tempObj.scale.set(scaleVar, scaleVar, scaleVar);
      
      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
      meshRef.current.setColorAt(i, new THREE.Color(colors[Math.floor(Math.random() * colors.length)]));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [shape, type]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial roughness={0.4} metalness={type === Sprinkles.GOLD ? 0.8 : 0.1} />
    </instancedMesh>
  );
};

export const Donut3D: React.FC<Donut3DProps> = ({ config, scale = 1, isPaused = false }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && !isPaused) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 0.5;
    }
  });

  const doughColor = getDoughColor(config.dough);
  const toppingColor = getToppingColor(config.topping);
  const fillingColor = getFillingColor(config.filling);

  return (
    <group ref={groupRef} scale={scale}>
      {/* Base Dough */}
      {config.shape === DonutShape.RING ? (
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[1, 0.4, 32, 64]} />
          <meshStandardMaterial color={doughColor} roughness={0.3} />
        </mesh>
      ) : (
        <mesh position={[0, 0, 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[1.3, 32, 32]} />
          <meshStandardMaterial color={doughColor} roughness={0.3} />
        </mesh>
      )}

      {/* Topping / Glaze */}
      {toppingColor && (
        config.shape === DonutShape.RING ? (
            <mesh position={[0, 0.02, 0]}>
                <torusGeometry args={[1, 0.41, 32, 64]} />
                <meshStandardMaterial color={toppingColor} roughness={0.2} metalness={0.1} />
            </mesh>
        ) : (
            <mesh position={[0, 0.2, 0]} scale={[1.05, 0.5, 1.05]}>
                <sphereGeometry args={[1.3, 32, 32]} />
                 <meshStandardMaterial color={toppingColor} roughness={0.2} metalness={0.1} transparent opacity={0.9} />
            </mesh>
        )
      )}

      {/* Sprinkles */}
      {config.sprinkles !== Sprinkles.NONE && (
          <SprinklesMesh shape={config.shape} type={config.sprinkles} />
      )}

      {/* Filling Indicator */}
      {config.shape === DonutShape.FILLED && fillingColor && (
          <mesh position={[0.8, 0.3, 0]} rotation={[0,0, -0.5]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={fillingColor} roughness={0.1} />
          </mesh>
      )}
    </group>
  );
};

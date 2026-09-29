"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

import type { ZuzuSceneProps } from "./types";

function ZuzuModel() {
  const group = useRef<THREE.Group>(null);

  const { scene, animations } = useGLTF("/zuzu/idle2.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // The GLB contains two animation clips:
    // - mixamo.com → actual 7-second Zuzu animation
    // - Scene → very short scene-level animation
    const firstAnimation = animations.find(
      (clip) => clip.name === "mixamo.com",
    );

    if (!firstAnimation) {
      console.warn("Zuzu GLB: mixamo.com animation was not found.");
      return;
    }

    const action = actions[firstAnimation.name];

    if (!action) {
      console.warn(
        `Zuzu GLB: animation action "${firstAnimation.name}" was not found.`,
      );
      return;
    }

    action.reset();
    action.fadeIn(0.3);
    action.play();

    return () => {
      action.fadeOut(0.3);
      action.stop();
    };
  }, [actions, animations]);

  useFrame(() => {
    if (!group.current) return;

    // Very subtle secondary motion.
    // The actual character movement comes from the GLB animation.
    group.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.025;
  });

  return (
    <group ref={group} position={[0, -1.15, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export default function ZuzuScene({
  height = 420,
  className,
  style,
}: ZuzuSceneProps) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height,
        ...style,
      }}
    >
      <Canvas
        camera={{
          position: [0, 1.1, 4.2],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.8} />

          <directionalLight
            position={[3, 5, 4]}
            intensity={2.5}
          />

          <directionalLight
            position={[-3, 2, 2]}
            intensity={1.2}
          />

          <Environment preset="studio" />

          <ZuzuModel />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/zuzu/idle2.glb");
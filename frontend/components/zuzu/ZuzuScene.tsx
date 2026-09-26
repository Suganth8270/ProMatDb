"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

import type { ZuzuCharacterState, ZuzuSceneProps } from "./types";

const IVORY = "#f5f2ea";
const PAPER = "#fbfaf6";
const CHARCOAL = "#18211f";
const CHARCOAL_SOFT = "#34403b";
const BLUE = "#7895bf";
const GREEN = "#4f8b76";
const EXHAUST = "#b9d7d2";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

function useStateClock(characterState: ZuzuCharacterState) {
  const previousStateRef = useRef(characterState);
  const elapsedRef = useRef(0);

  if (previousStateRef.current !== characterState) {
    previousStateRef.current = characterState;
    elapsedRef.current = 0;
  }

  return elapsedRef;
}

function Eye({
  position,
  blinkRef,
  characterState,
}: {
  position: [number, number, number];
  blinkRef: { current: number };
  characterState: ZuzuCharacterState;
}) {
  const eyeRef = useRef<Group>(null);
  const pupilRef = useRef<Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (!eyeRef.current || !pupilRef.current) return;
    const motionScale = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0.18 : 1;
    const lookAmount = characterState === "thinking" ? 0.7 : characterState === "listening" ? 0.28 : 0.5;
    const lookX = Math.sin(clock.getElapsedTime() * (characterState === "thinking" ? 1.5 : 0.65)) * lookAmount * motionScale;
    const blink = Math.max(0.12, blinkRef.current);
    eyeRef.current.scale.y = THREE.MathUtils.damp(eyeRef.current.scale.y, blink, 14, delta);
    pupilRef.current.position.x = THREE.MathUtils.damp(pupilRef.current.position.x, lookX * 0.018, 8, delta);
  });

  return (
    <group ref={eyeRef} position={position}>
      <mesh scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color={PAPER} roughness={0.42} />
      </mesh>
      <mesh ref={pupilRef} position={[0, 0, 0.035]} scale={[1, 1, 0.6]}>
        <sphereGeometry args={[0.038, 14, 10]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.42} />
      </mesh>
    </group>
  );
}

function Ear({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      <mesh scale={[1, 0.86, 0.62]}>
        <sphereGeometry args={[0.14, 18, 12]} />
        <meshStandardMaterial color={CHARCOAL} roughness={0.64} />
      </mesh>
      <mesh position={[0, 0, 0.075]} scale={[0.58, 0.55, 0.4]}>
        <sphereGeometry args={[0.14, 14, 10]} />
        <meshStandardMaterial color={CHARCOAL_SOFT} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Cheek({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} scale={[1.25, 0.62, 0.28]}>
      <sphereGeometry args={[0.045, 14, 10]} />
      <meshStandardMaterial color="#e8a6a1" roughness={0.55} transparent opacity={0.62} />
    </mesh>
  );
}

function Sprout() {
  return (
    <group position={[0, 0.31, 0]} rotation={[0, 0, -0.08]}>
      <mesh position={[-0.035, 0.055, 0]} rotation={[0, 0, -0.48]} scale={[0.58, 1, 0.38]}>
        <sphereGeometry args={[0.055, 14, 10]} />
        <meshStandardMaterial color="#67b87d" roughness={0.46} />
      </mesh>
      <mesh position={[0.045, 0.06, 0]} rotation={[0, 0, 0.42]} scale={[0.58, 1, 0.38]}>
        <sphereGeometry args={[0.055, 14, 10]} />
        <meshStandardMaterial color="#4f9c6c" roughness={0.46} />
      </mesh>
    </group>
  );
}

function Jetpack({ active }: { active: boolean }) {
  const exhaustRef = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    if (!exhaustRef.current) return;
    const pulse = active ? 0.84 + Math.sin(clock.getElapsedTime() * 14) * 0.12 : 0;
    exhaustRef.current.scale.y = THREE.MathUtils.damp(exhaustRef.current.scale.y, pulse, 10, delta);
    exhaustRef.current.scale.x = THREE.MathUtils.damp(exhaustRef.current.scale.x, active ? 1 : 0.25, 10, delta);
    exhaustRef.current.visible = active || exhaustRef.current.scale.y > 0.08;
  });

  return (
    <group position={[0, 0.02, -0.23]}>
      <RoundedBox args={[0.34, 0.43, 0.13]} radius={0.065} smoothness={3}>
        <meshStandardMaterial color={CHARCOAL_SOFT} metalness={0.48} roughness={0.35} />
      </RoundedBox>
      <mesh position={[-0.105, -0.19, 0]} rotation={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.055, 0.07, 0.19, 14]} />
        <meshStandardMaterial color={BLUE} metalness={0.58} roughness={0.28} />
      </mesh>
      <mesh position={[0.105, -0.19, 0]} rotation={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.055, 0.07, 0.19, 14]} />
        <meshStandardMaterial color={BLUE} metalness={0.58} roughness={0.28} />
      </mesh>
      <group ref={exhaustRef} position={[0, -0.35, 0]} scale={[0.25, 0, 0.25]}>
        <mesh position={[-0.105, 0, 0]}>
          <coneGeometry args={[0.045, 0.2, 10]} />
          <meshStandardMaterial color={EXHAUST} emissive={EXHAUST} emissiveIntensity={0.32} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.105, 0, 0]}>
          <coneGeometry args={[0.045, 0.2, 10]} />
          <meshStandardMaterial color={EXHAUST} emissive={EXHAUST} emissiveIntensity={0.32} transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function ZuzuCharacter({
  characterState,
  onCharacterClick,
}: Required<Pick<ZuzuSceneProps, "characterState">> & Pick<ZuzuSceneProps, "onCharacterClick">) {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const mouthRef = useRef<Mesh>(null);
  const elapsedRef = useStateClock(characterState);
  const blinkRef = useRef(1);
  const nextBlinkRef = useRef(2.4);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  useFrame(({ clock }, delta) => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const head = headRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;
    const leftLeg = leftLegRef.current;
    const rightLeg = rightLegRef.current;
    const mouth = mouthRef.current;
    if (!root || !body || !head || !leftArm || !rightArm || !leftLeg || !rightLeg || !mouth) return;

    elapsedRef.current += delta;
    const time = clock.getElapsedTime();
    const elapsed = elapsedRef.current;
    const motionScale = reducedMotionRef.current ? 0.18 : 1;
    const walk = Math.sin(time * 9.5) * motionScale;
    const talk = Math.sin(time * 10) * motionScale;

    if (time >= nextBlinkRef.current && blinkRef.current >= 1) {
      blinkRef.current = 0.02;
      nextBlinkRef.current = time + 2.7 + Math.random() * 2.4;
    }
    if (blinkRef.current < 1) blinkRef.current = Math.min(1, blinkRef.current + delta * 11);

    let targetY = 0;
    let targetTilt = 0;
    let bodyBob = Math.sin(time * 2.1) * 0.018 * motionScale;
    let armSwing = 0;
    let legSwing = 0;
    let mouthScale = 1;
    switch (characterState) {
      case "walking":
        bodyBob = Math.abs(walk) * 0.03 * motionScale;
        armSwing = walk * 0.27;
        legSwing = walk * 0.44;
        break;
      case "flying":
        targetY = 0.3 + Math.sin(time * 3.1) * 0.05 * motionScale;
        targetTilt = Math.sin(time * 2.2) * 0.07 * motionScale;
        bodyBob = Math.sin(time * 5.5) * 0.025 * motionScale;
        legSwing = Math.sin(time * 5) * 0.1 * motionScale;
        break;
      case "landing": {
        const progress = clamp01(elapsed / 0.9);
        const descent = 1 - smoothstep(progress);
        targetY = descent * 0.52;
        bodyBob = progress < 1 ? Math.sin(progress * Math.PI) * 0.07 * (1 - progress) : 0;
        targetTilt = progress < 1 ? Math.sin(progress * Math.PI) * 0.09 : 0;
        break;
      }
      case "listening":
        targetTilt = Math.sin(time * 1.7) * 0.045 * motionScale;
        break;
      case "thinking":
        targetTilt = Math.sin(time * 1.8) * 0.07 * motionScale;
        head.rotation.y = THREE.MathUtils.damp(head.rotation.y, Math.sin(time * 1.5) * 0.15 * motionScale, 6, delta);
        break;
      case "speaking":
        bodyBob = talk * 0.018;
        targetTilt = Math.sin(time * 3) * 0.028 * motionScale;
        armSwing = Math.sin(time * 3.2) * 0.1 * motionScale;
        mouthScale = 1 + Math.abs(talk) * 3.5;
        break;
      case "idle":
      default:
        head.rotation.y = THREE.MathUtils.damp(head.rotation.y, Math.sin(time * 0.65) * 0.06 * motionScale, 5, delta);
        break;
    }

    root.position.y = THREE.MathUtils.damp(root.position.y, targetY, 7, delta);
    root.rotation.z = THREE.MathUtils.damp(root.rotation.z, targetTilt, 7, delta);
    body.position.y = THREE.MathUtils.damp(body.position.y, bodyBob, 9, delta);
    head.rotation.z = THREE.MathUtils.damp(head.rotation.z, targetTilt * 0.45, 7, delta);
    leftArm.rotation.z = THREE.MathUtils.damp(leftArm.rotation.z, -0.12 - armSwing, 10, delta);
    rightArm.rotation.z = THREE.MathUtils.damp(rightArm.rotation.z, 0.12 + armSwing, 10, delta);
    leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, legSwing, 10, delta);
    rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, -legSwing, 10, delta);
    mouth.scale.y = THREE.MathUtils.damp(mouth.scale.y, mouthScale, 12, delta);

  });

  return (
    <group ref={rootRef} scale={0.48} onClick={onCharacterClick}>
      <group ref={bodyRef} position={[0, 0, 0]}>
        <Jetpack active={characterState === "flying"} />
        <RoundedBox args={[0.48, 0.58, 0.34]} radius={0.13} smoothness={4}>
          <meshStandardMaterial color={IVORY} metalness={0.24} roughness={0.38} />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.185]}>
          <circleGeometry args={[0.105, 24]} />
          <meshStandardMaterial color={GREEN} metalness={0.2} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.02, 0.192]} scale={[0.58, 0.58, 1]}>
          <circleGeometry args={[0.105, 24]} />
          <meshStandardMaterial color={PAPER} roughness={0.4} />
        </mesh>

        <group ref={leftArmRef} position={[-0.29, 0.04, 0]}>
          <RoundedBox args={[0.105, 0.36, 0.11]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color={CHARCOAL_SOFT} roughness={0.5} metalness={0.12} />
          </RoundedBox>
          <mesh position={[0, -0.21, 0]}>
            <sphereGeometry args={[0.075, 14, 10]} />
            <meshStandardMaterial color={IVORY} roughness={0.44} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.29, 0.04, 0]}>
          <RoundedBox args={[0.105, 0.36, 0.11]} radius={0.045} smoothness={3}>
            <meshStandardMaterial color={CHARCOAL_SOFT} roughness={0.5} metalness={0.12} />
          </RoundedBox>
          <mesh position={[0, -0.21, 0]}>
            <sphereGeometry args={[0.075, 14, 10]} />
            <meshStandardMaterial color={IVORY} roughness={0.44} />
          </mesh>
        </group>
      </group>

      <group ref={headRef} position={[0, 0.52, 0]}>
        <Sprout />
        <Ear position={[-0.24, 0.19, 0]} rotation={-0.12} />
        <Ear position={[0.24, 0.19, 0]} rotation={0.12} />
        <RoundedBox args={[0.64, 0.52, 0.44]} radius={0.17} smoothness={4}>
          <meshStandardMaterial color={IVORY} metalness={0.22} roughness={0.36} />
        </RoundedBox>
        <mesh position={[-0.2, 0.025, 0.235]} scale={[1.38, 1.16, 0.5]}>
          <sphereGeometry args={[0.11, 16, 12]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.62} />
        </mesh>
        <mesh position={[0.2, 0.025, 0.235]} scale={[1.38, 1.16, 0.5]}>
          <sphereGeometry args={[0.11, 16, 12]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.62} />
        </mesh>
        <Eye position={[-0.15, 0.04, 0.29]} blinkRef={blinkRef} characterState={characterState} />
        <Eye position={[0.15, 0.04, 0.29]} blinkRef={blinkRef} characterState={characterState} />
        <mesh position={[-0.15, 0.17, 0.285]} rotation={[0, 0, -0.18]} scale={[0.62, 0.15, 0.28]}>
          <sphereGeometry args={[0.06, 14, 8]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.5} />
        </mesh>
        <mesh position={[0.15, 0.17, 0.285]} rotation={[0, 0, 0.18]} scale={[0.62, 0.15, 0.28]}>
          <sphereGeometry args={[0.06, 14, 8]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.5} />
        </mesh>
        <Cheek position={[-0.2, -0.08, 0.285]} />
        <Cheek position={[0.2, -0.08, 0.285]} />
        <mesh position={[0, -0.075, 0.3]} scale={[0.5, 0.68, 0.46]}>
          <sphereGeometry args={[0.058, 16, 12]} />
          <meshStandardMaterial color={CHARCOAL} roughness={0.48} />
        </mesh>
        <mesh ref={mouthRef} position={[0, -0.155, 0.285]} scale={[0.66, 1, 0.42]}>
          <sphereGeometry args={[0.034, 12, 8]} />
          <meshStandardMaterial color={CHARCOAL_SOFT} roughness={0.48} />
        </mesh>
      </group>

      <group ref={leftLegRef} position={[-0.12, -0.4, 0]}>
        <RoundedBox args={[0.13, 0.28, 0.14]} radius={0.045} smoothness={3}>
          <meshStandardMaterial color={CHARCOAL_SOFT} roughness={0.5} metalness={0.12} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.09, 0.21]} radius={0.035} smoothness={3} position={[0, -0.18, 0.04]}>
          <meshStandardMaterial color={IVORY} roughness={0.42} />
        </RoundedBox>
      </group>
      <group ref={rightLegRef} position={[0.12, -0.4, 0]}>
        <RoundedBox args={[0.13, 0.28, 0.14]} radius={0.045} smoothness={3}>
          <meshStandardMaterial color={CHARCOAL_SOFT} roughness={0.5} metalness={0.12} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.09, 0.21]} radius={0.035} smoothness={3} position={[0, -0.18, 0.04]}>
          <meshStandardMaterial color={IVORY} roughness={0.42} />
        </RoundedBox>
      </group>
    </group>
  );
}

export default function ZuzuScene({
  characterState = "idle",
  onCharacterClick,
  className,
  style,
  height = 260,
}: ZuzuSceneProps) {
  const particles = useMemo(
    () => ({ count: 10, color: EXHAUST, scale: 1.2, size: 0.32, speed: 0.14, opacity: 0.16 }),
    [],
  );

  return (
    <div
      className={className}
      style={{ height, minHeight: 160, width: "100%", ...style }}
      role="img"
      aria-label="Zuzu, the ProMatDB robot panda assistant"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.18, 2.9], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 3, 4]} intensity={2.2} color="#fffaf0" />
        <directionalLight position={[-3, 1, 1]} intensity={0.45} color={BLUE} />
        <ZuzuCharacter characterState={characterState} onCharacterClick={onCharacterClick} />
        <ContactShadows position={[0, -0.64, 0]} opacity={0.18} scale={1.5} blur={2.2} far={1.4} />
        <Sparkles {...particles} position={[0, -0.28, -0.15]} />
      </Canvas>
    </div>
  );
}

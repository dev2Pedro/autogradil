'use client';

import { type ComponentRef, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  CanvasTexture,
  DoubleSide,
  type InstancedMesh,
  LinearMipmapLinearFilter,
  Object3D,
  RepeatWrapping,
} from 'three';
import { RotateCcwIcon } from 'lucide-react';
import { PANEL_LENGTH_MM, type FenceColor, type HeightMm } from '@autogradil/shared';
import { Button } from '@/components/ui/button';
import { FILL_BY_COLOR } from '@/lib/fence-colors';

const PANEL_LENGTH = PANEL_LENGTH_MM / 1000;
const POST_SIZE = 0.06;
const POST_EXTRA = 0.1;
const PANEL_LIFT = 0.03;
const WIRE_SPACING_X = 0.05;
const WIRE_SPACING_Y = 0.2;
const INITIAL_VIEW = 15;

type Fence3DProps = {
  panels: number;
  posts: number;
  heightMm: HeightMm;
  color: FenceColor;
};

function createMeshTexture(panelWidth: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 10, canvas.height);
    context.fillRect(0, 0, canvas.width, 8);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  texture.repeat.set(panelWidth / WIRE_SPACING_X, height / WIRE_SPACING_Y);
  return texture;
}

function Posts({ count, height, color }: { count: number; height: number; color: string }) {
  const ref = useRef<InstancedMesh>(null);
  const postHeight = height + POST_EXTRA;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    for (let index = 0; index < count; index++) {
      dummy.position.set(index * PANEL_LENGTH, postHeight / 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count, postHeight]);

  return (
    <instancedMesh key={count} ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[POST_SIZE, postHeight, POST_SIZE]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </instancedMesh>
  );
}

function Panels({ count, height, color }: { count: number; height: number; color: string }) {
  const ref = useRef<InstancedMesh>(null);
  const panelWidth = PANEL_LENGTH - POST_SIZE;
  const texture = useMemo(() => createMeshTexture(panelWidth, height), [panelWidth, height]);

  useLayoutEffect(() => () => texture.dispose(), [texture]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    for (let index = 0; index < count; index++) {
      dummy.position.set(index * PANEL_LENGTH + PANEL_LENGTH / 2, height / 2 + PANEL_LIFT, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count, height]);

  return (
    <instancedMesh key={count} ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[panelWidth, height]} />
      <meshStandardMaterial
        color={color}
        alphaMap={texture}
        transparent
        depthWrite={false}
        side={DoubleSide}
        metalness={0.4}
        roughness={0.5}
      />
    </instancedMesh>
  );
}

export function Fence3D({ panels, posts, heightMm, color }: Fence3DProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const height = heightMm / 1000;
  const totalLength = panels * PANEL_LENGTH;
  const view = Math.min(totalLength, INITIAL_VIEW);
  const target: [number, number, number] = [view / 2, height / 2, 0];
  const distance = view * 0.65 + 2;
  const cameraPosition: [number, number, number] = [
    view / 2 - distance * 0.3,
    height + distance * 0.12,
    distance,
  ];
  const fill = FILL_BY_COLOR[color];

  function recenter() {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...cameraPosition);
    controls.target.set(...target);
    controls.update();
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl border bg-linear-to-b from-sky-100 to-sky-50 sm:h-96 dark:from-zinc-800 dark:to-zinc-900">
      <Canvas
        key={`${panels}-${heightMm}`}
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: cameraPosition, fov: 45, near: 0.05, far: totalLength + 500 }}
        aria-label={`Visualização 3D da cerca com ${panels} telas e ${posts} postes`}
        fallback={
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            Seu navegador não suporta WebGL, então a visualização 3D não está disponível.
          </div>
        }
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 8]} intensity={1.6} />
        <directionalLight position={[-5, 4, -8]} intensity={0.5} />
        <mesh rotation-x={-Math.PI / 2} position={[totalLength / 2, 0, 0]}>
          <planeGeometry args={[totalLength + 400, 400]} />
          <meshStandardMaterial color="#d6d3d1" roughness={1} />
        </mesh>
        <Posts count={posts} height={height} color={fill} />
        <Panels count={panels} height={height} color={fill} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={target}
          minDistance={1}
          maxDistance={totalLength + 200}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>
      <div className="absolute top-2 right-2">
        <Button size="sm" variant="secondary" onClick={recenter}>
          <RotateCcwIcon />
          Recentralizar
        </Button>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-3 text-xs text-muted-foreground">
        Arraste para girar, role para aproximar, botão direito para mover.
      </p>
    </div>
  );
}

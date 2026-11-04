'use client';

import { type ComponentRef, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  CanvasTexture,
  DoubleSide,
  type InstancedMesh,
  LinearMipmapLinearFilter,
  Object3D,
  RepeatWrapping,
  TOUCH,
} from 'three';
import { LockIcon, Move3dIcon, RotateCcwIcon } from 'lucide-react';
import { PANEL_LENGTH_MM, type FenceColor, type HeightMm } from '@autogradil/shared';
import { Button } from '@/components/ui/button';
import { POST_BY_COLOR } from '@/lib/fence-colors';
import { cn } from '@/lib/utils';

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
  const [engaged, setEngaged] = useState(false);
  const height = heightMm / 1000;
  const totalLength = panels * PANEL_LENGTH;
  const view = Math.min(totalLength, INITIAL_VIEW);
  const target: [number, number, number] = [view / 2, height / 2, 0];
  const distance = view * 0.75 + 3;
  const cameraPosition: [number, number, number] = [
    view / 2 - distance * 0.3,
    height + distance * 0.2,
    distance,
  ];
  const fill = POST_BY_COLOR[color];

  function recenter() {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...cameraPosition);
    controls.target.set(...target);
    controls.update();
  }

  return (
    <div
      className="relative h-72 overflow-hidden bg-linear-to-b from-[#e3e8ec] to-[#f1f3f1] sm:h-96"
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setEngaged(false);
      }}
    >
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
        <fog attach="fog" args={['#e8ecee', view + 10, view + 140]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 10, 8]} intensity={1.6} />
        <directionalLight position={[-5, 4, -8]} intensity={0.5} />
        <mesh rotation-x={-Math.PI / 2} position={[totalLength / 2, 0, 0]}>
          <planeGeometry args={[totalLength + 400, 400]} />
          <meshStandardMaterial color="#d9ddda" roughness={1} />
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
          touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
        />
      </Canvas>

      {!engaged && (
        <button
          type="button"
          onClick={() => setEngaged(true)}
          className="group/engage absolute inset-0 flex items-end justify-center pb-5 outline-none"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-foreground/85 px-4 py-2 text-sm font-medium text-background shadow-[0_6px_20px_-8px_rgb(0_0_0/0.45)] transition-transform duration-200 group-hover/engage:scale-[1.03] group-focus-visible/engage:ring-3 group-focus-visible/engage:ring-ring/50">
            <Move3dIcon className="size-4" aria-hidden="true" />
            Explorar em 3D
          </span>
        </button>
      )}

      <div
        className={cn(
          'absolute top-3 right-3 flex gap-2 transition-opacity duration-200',
          engaged ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <Button size="sm" variant="secondary" onClick={recenter} tabIndex={engaged ? 0 : -1}>
          <RotateCcwIcon />
          Recentralizar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEngaged(false)}
          tabIndex={engaged ? 0 : -1}
        >
          <LockIcon />
          Travar
        </Button>
      </div>

      <p
        className={cn(
          'pointer-events-none absolute bottom-3 left-3 rounded-md bg-sheet/90 px-2 py-1 text-xs text-foreground transition-opacity duration-200',
          engaged ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="pointer-coarse:hidden">
          Arraste para girar · role para aproximar · botão direito move
        </span>
        <span className="hidden pointer-coarse:inline">
          Um dedo gira · dois dedos aproximam e movem
        </span>
      </p>
    </div>
  );
}

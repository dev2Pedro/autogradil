'use client';

import { type ComponentRef, type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { type DirectionalLight, PerspectiveCamera, TOUCH } from 'three';
import { LockIcon, Move3dIcon, RotateCcwIcon } from 'lucide-react';
import { FASTENERS_BY_HEIGHT_MM, type FenceColor, type HeightMm } from '@autogradil/shared';
import { Button } from '@/components/ui/button';
import { Clips, DetailedPanels, FarPanels, Ground, Posts } from '@/components/fence-3d-parts';
import { PAINT_BY_COLOR } from '@/lib/fence-colors';
import { PANEL_LENGTH } from '@/lib/fence-3d-geometry';
import { FIELD_OF_VIEW, frameFence } from '@/lib/fence-3d-framing';
import { cn } from '@/lib/utils';

const INITIAL_VIEW = 12.5;
const DEFAULT_HEIGHT_CLASS = 'h-72 sm:h-96';
const DETAIL_PANEL_LIMIT = 60;
const SHADOW_MAP_SIZE = 2048;
const SHADOW_INTENSITY = 0.6;
const SHADOW_MARGIN = 4;

type Fence3DProps = {
  panels: number;
  posts: number;
  heightMm: HeightMm;
  color: FenceColor;
  className?: string;
};

type ControlsRef = RefObject<ComponentRef<typeof OrbitControls> | null>;

type CameraRigProps = {
  view: number;
  heightM: number;
  controlsRef: ControlsRef;
  recenterRef: RefObject<(() => void) | null>;
};

function CameraRig({ view, heightM, controlsRef, recenterRef }: CameraRigProps) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const fov = camera instanceof PerspectiveCamera ? camera.fov : FIELD_OF_VIEW;
  const aspect = size.width / Math.max(size.height, 1);

  useLayoutEffect(() => {
    const frame = () => {
      const { position, target } = frameFence({ view, heightM, aspect, fov });
      camera.position.set(...position);
      camera.lookAt(...target);
      const controls = controlsRef.current;
      if (controls) {
        controls.target.set(...target);
        controls.update();
      }
      invalidate();
    };

    frame();
    recenterRef.current = frame;
    return () => {
      recenterRef.current = null;
    };
  }, [camera, controlsRef, recenterRef, view, heightM, aspect, fov, invalidate]);

  return null;
}

function KeyLight({ center, extent }: { center: number; extent: number }) {
  const ref = useRef<DirectionalLight>(null);

  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.target.position.set(center, 0, 0);
    light.target.updateMatrixWorld();
  }, [center]);

  return (
    <directionalLight
      ref={ref}
      position={[center + 5, 11, -6]}
      intensity={2.4}
      castShadow
      shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
      shadow-camera-left={-extent}
      shadow-camera-right={extent}
      shadow-camera-top={extent}
      shadow-camera-bottom={-extent}
      shadow-camera-near={1}
      shadow-camera-far={40}
      shadow-bias={-0.0004}
      shadow-normalBias={0.01}
      shadow-intensity={SHADOW_INTENSITY}
    />
  );
}

function StudioEnvironment() {
  return (
    <Environment resolution={256} environmentIntensity={1.1}>
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#ffffff"
        position={[0, 9, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[24, 24, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.3}
        color="#f1f5ff"
        position={[-9, 3, 7]}
        rotation={[0, Math.PI / 2.4, 0]}
        scale={[12, 6, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1}
        color="#fff6ea"
        position={[9, 3, -6]}
        rotation={[0, -Math.PI / 2.4, 0]}
        scale={[12, 6, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.6}
        color="#d2d8cd"
        position={[0, -3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[24, 24, 1]}
      />
    </Environment>
  );
}

export function Fence3D({
  panels,
  posts,
  heightMm,
  color,
  className = DEFAULT_HEIGHT_CLASS,
}: Fence3DProps) {
  const controlsRef: ControlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const recenterRef = useRef<(() => void) | null>(null);
  const [engaged, setEngaged] = useState(false);
  const heightM = heightMm / 1000;
  const totalLength = panels * PANEL_LENGTH;
  const view = Math.min(totalLength, INITIAL_VIEW);
  const detailPanels = Math.min(panels, DETAIL_PANEL_LIMIT);
  const paint = PAINT_BY_COLOR[color];
  const initialFraming = frameFence({ view, heightM, aspect: 16 / 9, fov: FIELD_OF_VIEW });

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-linear-to-b from-[#e3e8ec] to-[#f1f3f1]',
        className,
      )}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setEngaged(false);
      }}
    >
      <Canvas
        key={`${panels}-${heightMm}`}
        frameloop="demand"
        dpr={[1, 2]}
        shadows="percentage"
        camera={{
          position: initialFraming.position,
          fov: FIELD_OF_VIEW,
          near: 0.05,
          far: totalLength + 500,
        }}
        aria-label={`Visualização 3D da cerca com ${panels} telas e ${posts} postes`}
        fallback={
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            Seu navegador não suporta WebGL, então a visualização 3D não está disponível.
          </div>
        }
      >
        <fog attach="fog" args={['#e8ecee', view + 12, view + 130]} />
        <StudioEnvironment />
        <hemisphereLight args={['#ffffff', '#b9beb9', 0.3]} />
        <KeyLight center={view / 2} extent={view / 2 + SHADOW_MARGIN} />
        <directionalLight position={[-4, 4, 9]} intensity={0.35} />
        <Ground panels={panels} />
        <Posts count={posts} detailCount={detailPanels + 1} height={heightM} paint={paint} />
        <DetailedPanels count={detailPanels} height={heightM} paint={paint} />
        <Clips
          panels={detailPanels}
          fasteners={FASTENERS_BY_HEIGHT_MM[heightMm]}
          height={heightM}
        />
        {panels > detailPanels && (
          <FarPanels
            start={detailPanels}
            count={panels - detailPanels}
            height={heightM}
            paint={paint}
          />
        )}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={initialFraming.target}
          minDistance={0.6}
          maxDistance={totalLength + 200}
          maxPolarAngle={Math.PI / 2 - 0.02}
          touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
        />
        <CameraRig
          view={view}
          heightM={heightM}
          controlsRef={controlsRef}
          recenterRef={recenterRef}
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
        <Button
          size="sm"
          variant="secondary"
          onClick={() => recenterRef.current?.()}
          tabIndex={engaged ? 0 : -1}
        >
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

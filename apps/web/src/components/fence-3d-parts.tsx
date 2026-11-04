'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { DoubleSide, type InstancedMesh, Object3D } from 'three';
import type { FencePaint } from '@/lib/fence-colors';
import {
  buildBoltGeometry,
  buildClipGeometry,
  buildPanelGeometry,
  buildPostPaintGeometry,
  clipPlacements,
  PANEL_LENGTH,
  PANEL_LIFT,
  PANEL_WIDTH,
  PANEL_Z,
  POST_EXTRA,
  POST_SIZE,
} from '@/lib/fence-3d-geometry';
import {
  createLawnTexture,
  createMeshAlphaTexture,
  createPavingTexture,
} from '@/lib/fence-3d-textures';

const WIRE_SPACING_X = 0.05;
const WIRE_SPACING_Y = 0.2;
const LAWN_TILE_M = 3;
const LAWN_DEPTH_M = 400;
const LAWN_MARGIN_M = 400;
const PAVING_DEPTH_M = 0.8;
const PAVING_CENTER_Z = 0.1;
const GALVANIZED = { color: '#b9c0c5', metalness: 0.9, roughness: 0.35 };

type Place = (index: number, dummy: Object3D) => void;

function useInstances(count: number, place: Place) {
  const ref = useRef<InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    for (let index = 0; index < count; index++) {
      dummy.position.set(0, 0, 0);
      place(index, dummy);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [count, place, invalidate]);

  return ref;
}

function PaintMaterial({ paint }: { paint: FencePaint }) {
  return (
    <meshPhysicalMaterial
      color={paint.color}
      metalness={paint.metalness}
      roughness={paint.roughness}
      clearcoat={paint.clearcoat}
      clearcoatRoughness={0.35}
    />
  );
}

function GalvanizedMaterial() {
  return (
    <meshStandardMaterial
      color={GALVANIZED.color}
      metalness={GALVANIZED.metalness}
      roughness={GALVANIZED.roughness}
    />
  );
}

type PostsProps = { count: number; detailCount: number; height: number; paint: FencePaint };

export function Posts({ count, detailCount, height, paint }: PostsProps) {
  const postHeight = height + POST_EXTRA;
  const paintGeometry = useMemo(() => buildPostPaintGeometry(postHeight), [postHeight]);
  const boltGeometry = useMemo(() => buildBoltGeometry(), []);

  useEffect(() => () => paintGeometry.dispose(), [paintGeometry]);
  useEffect(() => () => boltGeometry.dispose(), [boltGeometry]);

  const placeBody = useCallback<Place>(
    (index, dummy) => dummy.position.set(index * PANEL_LENGTH, postHeight / 2, 0),
    [postHeight],
  );
  const placeAtBase = useCallback<Place>(
    (index, dummy) => dummy.position.set(index * PANEL_LENGTH, 0, 0),
    [],
  );

  const bodyRef = useInstances(count, placeBody);
  const paintRef = useInstances(detailCount, placeAtBase);
  const boltRef = useInstances(detailCount, placeAtBase);

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <boxGeometry args={[POST_SIZE, postHeight, POST_SIZE]} />
        <PaintMaterial paint={paint} />
      </instancedMesh>
      <instancedMesh
        ref={paintRef}
        args={[paintGeometry, undefined, detailCount]}
        castShadow
        receiveShadow
      >
        <PaintMaterial paint={paint} />
      </instancedMesh>
      <instancedMesh ref={boltRef} args={[boltGeometry, undefined, detailCount]} castShadow>
        <GalvanizedMaterial />
      </instancedMesh>
    </>
  );
}

type DetailedPanelsProps = { count: number; height: number; paint: FencePaint };

export function DetailedPanels({ count, height, paint }: DetailedPanelsProps) {
  const geometry = useMemo(() => buildPanelGeometry(height), [height]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const place = useCallback<Place>(
    (index, dummy) =>
      dummy.position.set(index * PANEL_LENGTH + PANEL_LENGTH / 2, PANEL_LIFT, PANEL_Z),
    [],
  );
  const ref = useInstances(count, place);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]} castShadow>
      <PaintMaterial paint={paint} />
    </instancedMesh>
  );
}

type ClipsProps = { panels: number; fasteners: number; height: number };

export function Clips({ panels, fasteners, height }: ClipsProps) {
  const geometry = useMemo(() => buildClipGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const placements = useMemo(
    () =>
      Array.from({ length: panels }, (_, panel) => clipPlacements(panel, height, fasteners)).flat(),
    [panels, fasteners, height],
  );
  const place = useCallback<Place>(
    (index, dummy) => {
      const { x, y, z } = placements[index];
      dummy.position.set(x, y, z);
    },
    [placements],
  );
  const ref = useInstances(placements.length, place);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, placements.length]} castShadow>
      <GalvanizedMaterial />
    </instancedMesh>
  );
}

type FarPanelsProps = { start: number; count: number; height: number; paint: FencePaint };

export function FarPanels({ start, count, height, paint }: FarPanelsProps) {
  const panelWidth = PANEL_WIDTH;
  const texture = useMemo(
    () => createMeshAlphaTexture(panelWidth, height, WIRE_SPACING_X, WIRE_SPACING_Y),
    [panelWidth, height],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  const place = useCallback<Place>(
    (index, dummy) =>
      dummy.position.set(
        (start + index) * PANEL_LENGTH + PANEL_LENGTH / 2,
        height / 2 + PANEL_LIFT,
        PANEL_Z,
      ),
    [start, height],
  );
  const ref = useInstances(count, place);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[panelWidth, height]} />
      <meshStandardMaterial
        color={paint.color}
        alphaMap={texture}
        transparent
        depthWrite={false}
        side={DoubleSide}
        metalness={paint.metalness}
        roughness={paint.roughness}
      />
    </instancedMesh>
  );
}

export function Ground({ panels }: { panels: number }) {
  const totalLength = panels * PANEL_LENGTH;
  const lawnWidth = totalLength + LAWN_MARGIN_M;
  const lawn = useMemo(
    () => createLawnTexture(lawnWidth / LAWN_TILE_M, LAWN_DEPTH_M / LAWN_TILE_M),
    [lawnWidth],
  );
  const paving = useMemo(() => createPavingTexture(panels + 1), [panels]);

  useEffect(() => () => lawn.dispose(), [lawn]);
  useEffect(() => () => paving.dispose(), [paving]);

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[totalLength / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[lawnWidth, LAWN_DEPTH_M]} />
        <meshStandardMaterial map={lawn} roughness={1} />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[totalLength / 2, 0.003, PAVING_CENTER_Z]}
        receiveShadow
      >
        <planeGeometry args={[(panels + 1) * PANEL_LENGTH, PAVING_DEPTH_M]} />
        <meshStandardMaterial
          map={paving}
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </>
  );
}

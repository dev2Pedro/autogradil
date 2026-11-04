import { BoxGeometry, BufferGeometry, CylinderGeometry, Matrix4, Quaternion, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PANEL_LENGTH_MM } from '@autogradil/shared';
import { foldPositions } from '@/lib/fence-folds';

export const PANEL_LENGTH = PANEL_LENGTH_MM / 1000;
export const POST_SIZE = 0.06;
export const POST_EXTRA = 0.1;
export const PANEL_LIFT = 0.03;
export const PANEL_Z = POST_SIZE / 2 + 0.006;
export const PANEL_WIDTH = PANEL_LENGTH - 0.02;

const FOLD_DEPTH = 0.016;
const FOLD_HALF_WIDTH = 0.06;
const VERTICAL_WIRES = 49;
const VERTICAL_RADIUS = 0.0035;
const HORIZONTAL_RADIUS = 0.0045;
const HORIZONTAL_OFFSET = VERTICAL_RADIUS + HORIZONTAL_RADIUS;
const WIRE_SEGMENTS = 5;
const EDGE_INSET = 0.04;
const PAIR_OFFSET = 0.012;
const MESH_PITCH = 0.2;
const PLATE_SIZE = 0.13;
const PLATE_HEIGHT = 0.008;
const BOLT_OFFSET = 0.046;
const CLIP_WIDTH = 0.034;
const CLIP_HEIGHT = 0.052;
const CLIP_THICKNESS = 0.004;
const CLIP_STANDOFF = 0.002;
const CLIP_EDGE_INSET = 0.018;
const UP = new Vector3(0, 1, 0);

type ProfilePoint = { y: number; z: number };

export type ClipPlacement = { x: number; y: number; z: number };

function combine(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return merged;
}

function wireBetween(from: Vector3, to: Vector3, radius: number): BufferGeometry {
  const direction = to.clone().sub(from);
  const geometry = new CylinderGeometry(radius, radius, direction.length(), WIRE_SEGMENTS, 1, true);
  const matrix = new Matrix4().compose(
    from.clone().add(to).multiplyScalar(0.5),
    new Quaternion().setFromUnitVectors(UP, direction.clone().normalize()),
    new Vector3(1, 1, 1),
  );
  return geometry.applyMatrix4(matrix);
}

function foldHeights(heightM: number): number[] {
  return foldPositions(heightM).map((fraction) => fraction * heightM);
}

function profile(heightM: number): ProfilePoint[] {
  const points: ProfilePoint[] = [{ y: 0, z: 0 }];
  for (const y of foldHeights(heightM)) {
    points.push(
      { y: y - FOLD_HALF_WIDTH, z: 0 },
      { y, z: FOLD_DEPTH },
      { y: y + FOLD_HALF_WIDTH, z: 0 },
    );
  }
  points.push({ y: heightM, z: 0 });
  return points;
}

export function panelDepthAt(heightM: number, y: number): number {
  const points = profile(heightM);
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    if (y <= current.y) {
      const progress = (y - previous.y) / (current.y - previous.y);
      return previous.z + progress * (current.z - previous.z);
    }
  }
  return 0;
}

function horizontalHeights(heightM: number): number[] {
  const anchors = [EDGE_INSET, ...foldHeights(heightM), heightM - EDGE_INSET];
  const heights: number[] = [];

  anchors.forEach((anchor, index) => {
    heights.push(anchor - PAIR_OFFSET, anchor + PAIR_OFFSET);
    const next = anchors[index + 1];
    if (next === undefined) return;

    const fillers = Math.ceil((next - anchor) / MESH_PITCH) - 1;
    for (let step = 1; step <= fillers; step++) {
      heights.push(anchor + ((next - anchor) * step) / (fillers + 1));
    }
  });

  return heights;
}

export function buildPanelGeometry(heightM: number): BufferGeometry {
  const points = profile(heightM);
  const parts: BufferGeometry[] = [];

  for (let wire = 0; wire < VERTICAL_WIRES; wire++) {
    const x = -PANEL_WIDTH / 2 + (wire * PANEL_WIDTH) / (VERTICAL_WIRES - 1);
    for (let index = 1; index < points.length; index++) {
      const from = points[index - 1];
      const to = points[index];
      parts.push(
        wireBetween(new Vector3(x, from.y, from.z), new Vector3(x, to.y, to.z), VERTICAL_RADIUS),
      );
    }
  }

  for (const y of horizontalHeights(heightM)) {
    const z = panelDepthAt(heightM, y) + HORIZONTAL_OFFSET;
    parts.push(
      wireBetween(
        new Vector3(-PANEL_WIDTH / 2, y, z),
        new Vector3(PANEL_WIDTH / 2, y, z),
        HORIZONTAL_RADIUS,
      ),
    );
  }

  return combine(parts);
}

export function buildPostPaintGeometry(postHeight: number): BufferGeometry {
  const plate = new BoxGeometry(PLATE_SIZE, PLATE_HEIGHT, PLATE_SIZE).translate(
    0,
    PLATE_HEIGHT / 2,
    0,
  );
  const cap = new BoxGeometry(POST_SIZE + 0.012, 0.014, POST_SIZE + 0.012).translate(
    0,
    postHeight + 0.007,
    0,
  );
  const crown = new BoxGeometry(POST_SIZE - 0.014, 0.008, POST_SIZE - 0.014).translate(
    0,
    postHeight + 0.018,
    0,
  );
  return combine([plate, cap, crown]);
}

export function buildBoltGeometry(): BufferGeometry {
  const corners = [-1, 1].flatMap((signX) => [-1, 1].map((signZ) => [signX, signZ] as const));
  return combine(
    corners.map(([signX, signZ]) =>
      new CylinderGeometry(0.0085, 0.0085, 0.006, 6).translate(
        signX * BOLT_OFFSET,
        PLATE_HEIGHT + 0.003,
        signZ * BOLT_OFFSET,
      ),
    ),
  );
}

export function buildClipGeometry(): BufferGeometry {
  const plate = new BoxGeometry(CLIP_WIDTH, CLIP_HEIGHT, CLIP_THICKNESS);
  const bolt = new CylinderGeometry(0.007, 0.007, 0.005, 6)
    .rotateX(Math.PI / 2)
    .translate(0, 0, CLIP_THICKNESS / 2 + 0.0025);
  return combine([plate, bolt]);
}

export function clipPlacements(
  panelIndex: number,
  heightM: number,
  fasteners: number,
): ClipPlacement[] {
  return Array.from({ length: fasteners }, (_, index) => {
    const localY = (heightM * (index + 0.5)) / fasteners;
    const onLeftPost = index % 2 === 0;
    return {
      x:
        panelIndex * PANEL_LENGTH + (onLeftPost ? CLIP_EDGE_INSET : PANEL_LENGTH - CLIP_EDGE_INSET),
      y: PANEL_LIFT + localY,
      z:
        PANEL_Z +
        panelDepthAt(heightM, localY) +
        HORIZONTAL_OFFSET +
        HORIZONTAL_RADIUS +
        CLIP_STANDOFF +
        CLIP_THICKNESS / 2,
    };
  });
}

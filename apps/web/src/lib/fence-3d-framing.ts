export const FIELD_OF_VIEW = 45;

const CAMERA_AZIMUTH = (14 * Math.PI) / 180;
const CAMERA_ELEVATION = (20 * Math.PI) / 180;
const FRAMING_MARGIN = 1.25;
const TARGET_HEIGHT_RATIO = 0.45;

export type Vector3Tuple = [number, number, number];

export type Framing = { position: Vector3Tuple; target: Vector3Tuple };

export function frameFence(params: {
  view: number;
  heightM: number;
  aspect: number;
  fov: number;
}): Framing {
  const { view, heightM, aspect, fov } = params;
  const halfVertical = Math.tan((fov * Math.PI) / 360);
  const halfHorizontal = halfVertical * aspect;
  const width = view * Math.cos(CAMERA_AZIMUTH);
  const visibleHeight =
    heightM * Math.cos(CAMERA_ELEVATION) +
    view * Math.sin(CAMERA_AZIMUTH) * Math.sin(CAMERA_ELEVATION);
  const distance =
    Math.max(width / 2 / halfHorizontal, visibleHeight / 2 / halfVertical) * FRAMING_MARGIN;
  const target: Vector3Tuple = [view / 2, heightM * TARGET_HEIGHT_RATIO, 0];

  return {
    target,
    position: [
      target[0] - distance * Math.sin(CAMERA_AZIMUTH) * Math.cos(CAMERA_ELEVATION),
      target[1] + distance * Math.sin(CAMERA_ELEVATION),
      distance * Math.cos(CAMERA_AZIMUTH) * Math.cos(CAMERA_ELEVATION),
    ],
  };
}

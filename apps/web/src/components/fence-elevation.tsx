import { useId } from 'react';
import { HEIGHTS_MM, PANEL_LENGTH_MM, type FenceColor, type HeightMm } from '@autogradil/shared';
import { EDGE_BY_COLOR, POST_BY_COLOR, WIRE_BY_COLOR } from '@/lib/fence-colors';
import { formatMeters, plural } from '@/lib/labels';
import { cn } from '@/lib/utils';

const SCALE = 40;
const PANEL = (PANEL_LENGTH_MM / 1000) * SCALE;
const POST_WIDTH = 3.2;
const POST_EXTRA = 0.12 * SCALE;
const BREAK_GAP = 36;
const MAX_HEIGHT = (Math.max(...HEIGHTS_MM) / 1000) * SCALE;

type Variant = 'full' | 'compact' | 'mini';

const LAYOUT: Record<Variant, { max: number; lead: number; tail: number; wireStep: number }> = {
  full: { max: 5, lead: 2, tail: 2, wireStep: 0.1 },
  compact: { max: 3, lead: 1, tail: 1, wireStep: 0.1 },
  mini: { max: 9, lead: 4, tail: 4, wireStep: 0.25 },
};

const MARGIN: Record<Variant, { top: number; right: number; bottom: number; left: number }> = {
  full: { top: 40, right: 14, bottom: 44, left: 44 },
  compact: { top: 40, right: 14, bottom: 44, left: 44 },
  mini: { top: 2, right: 4, bottom: 3, left: 4 },
};

type FenceElevationProps = {
  panels: number;
  heightMm: HeightMm;
  color: FenceColor;
  soldLengthMm: number;
  requestedLengthMm?: number;
  variant?: Variant;
  className?: string;
};

type PanelSlot = { index: number; x: number };

function layoutPanels(panels: number, variant: Variant) {
  const { max, lead, tail } = LAYOUT[variant];
  const broken = panels > max;
  const slots: PanelSlot[] = [];
  let x = 0;
  const indices = broken
    ? [
        ...Array.from({ length: lead }, (_, i) => i),
        ...Array.from({ length: tail }, (_, i) => panels - tail + i),
      ]
    : Array.from({ length: panels }, (_, i) => i);

  indices.forEach((index, position) => {
    if (broken && position === lead) x += BREAK_GAP;
    slots.push({ index, x });
    x += PANEL;
  });

  return {
    slots,
    broken,
    width: x,
    breakX: broken ? lead * PANEL + BREAK_GAP / 2 : null,
    hiddenPanels: broken ? panels - lead - tail : 0,
  };
}

function foldPositions(heightM: number): number[] {
  const folds = Math.max(2, Math.round(heightM / 0.5));
  return Array.from({ length: folds }, (_, i) => (i + 0.5) / folds);
}

function Tick({ x, y }: { x: number; y: number }) {
  return <path d={`M ${x - 4} ${y + 4} L ${x + 4} ${y - 4}`} strokeWidth="1.2" />;
}

export function FenceElevation({
  panels,
  heightMm,
  color,
  soldLengthMm,
  requestedLengthMm,
  variant = 'full',
  className,
}: FenceElevationProps) {
  const hatchId = useId();
  const margin = MARGIN[variant];
  const { slots, broken, width, breakX, hiddenPanels } = layoutPanels(panels, variant);
  const heightM = heightMm / 1000;
  const h = heightM * SCALE;
  const drawingHeight = variant === 'mini' ? MAX_HEIGHT + POST_EXTRA : h + POST_EXTRA;
  const baseY = margin.top + drawingHeight;
  const panelTop = baseY - h;
  const postTop = panelTop - POST_EXTRA;
  const viewWidth = margin.left + width + margin.right;
  const viewHeight = baseY + margin.bottom;
  const wire = WIRE_BY_COLOR[color];
  const edge = EDGE_BY_COLOR[color];
  const postFill = POST_BY_COLOR[color];
  const { wireStep } = LAYOUT[variant];
  const verticalWires = Array.from(
    { length: Math.floor(2.5 / wireStep) - 1 },
    (_, i) => (i + 1) * wireStep * SCALE,
  );
  const horizontalWires = Array.from(
    { length: Math.floor(heightM / 0.2) },
    (_, i) => baseY - (i + 1) * 0.2 * SCALE,
  ).filter((y) => y > panelTop + 1);
  const folds = foldPositions(heightM).map((f) => panelTop + f * h);
  const x0 = margin.left;
  const xEnd = margin.left + width;
  const lastSlot = slots[slots.length - 1];
  const surplusMm =
    requestedLengthMm !== undefined ? Math.max(0, soldLengthMm - requestedLengthMm) : 0;
  const requestedX =
    surplusMm > 0 && requestedLengthMm !== undefined
      ? margin.left +
        lastSlot.x +
        ((requestedLengthMm - (panels - 1) * PANEL_LENGTH_MM) / PANEL_LENGTH_MM) * PANEL
      : null;
  const label = `Elevação da cerca: ${plural(panels, 'tela', 'telas')}, ${formatMeters(soldLengthMm)} de comprimento, ${formatMeters(heightMm)} de altura`;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      role={variant !== 'mini' ? 'img' : undefined}
      aria-label={variant !== 'mini' ? label : undefined}
      aria-hidden={variant === 'mini' ? true : undefined}
      preserveAspectRatio={variant === 'mini' ? 'xMinYMax meet' : 'xMidYMid meet'}
      className={cn('block overflow-visible', className)}
    >
      <defs>
        <pattern
          id={hatchId}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path d="M 0 0 L 0 5" className="stroke-primary" strokeWidth="1.4" />
        </pattern>
      </defs>

      <line
        x1={variant !== 'mini' ? x0 - 12 : 0}
        x2={variant !== 'mini' ? xEnd + 12 : viewWidth}
        y1={baseY}
        y2={baseY}
        className="stroke-foreground"
        strokeOpacity="0.55"
        strokeWidth="1"
      />

      {variant !== 'mini' &&
        Array.from({ length: Math.ceil((xEnd - x0 + 24) / 10) }, (_, i) => x0 - 12 + i * 10).map(
          (x) => (
            <path
              key={x}
              d={`M ${x} ${baseY + 1} l -5 5`}
              className="stroke-foreground"
              strokeOpacity="0.2"
              strokeWidth="0.8"
            />
          ),
        )}

      {slots.map((slot) => {
        const left = margin.left + slot.x;
        return (
          <g key={slot.index}>
            <g stroke={wire} strokeWidth={variant === 'mini' ? 0.9 : 0.6}>
              {verticalWires.map((dx) => (
                <line key={dx} x1={left + dx} x2={left + dx} y1={panelTop} y2={baseY - 1} />
              ))}
              {horizontalWires.map((y) => (
                <line key={y} x1={left} x2={left + PANEL} y1={y} y2={y} />
              ))}
            </g>
            <g stroke={edge} strokeWidth={variant === 'mini' ? 1.6 : 1.2}>
              {folds.map((y) => (
                <g key={y}>
                  <line x1={left} x2={left + PANEL} y1={y - 1.2} y2={y - 1.2} />
                  <line x1={left} x2={left + PANEL} y1={y + 1.2} y2={y + 1.2} />
                </g>
              ))}
              <rect
                x={left}
                y={panelTop}
                width={PANEL}
                height={h - 1}
                fill="none"
                strokeWidth={variant === 'mini' ? 1.4 : 1}
              />
            </g>
          </g>
        );
      })}

      {requestedX !== null && lastSlot && (
        <g>
          <rect
            x={requestedX}
            y={panelTop}
            width={margin.left + lastSlot.x + PANEL - requestedX}
            height={h}
            fill={`url(#${hatchId})`}
            opacity="0.45"
          />
          <line
            x1={requestedX}
            x2={requestedX}
            y1={panelTop - (variant !== 'mini' ? 10 : 0)}
            y2={baseY + (variant !== 'mini' ? 10 : 0)}
            className="stroke-primary"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
        </g>
      )}

      {[...slots.map((slot) => margin.left + slot.x), xEnd]
        .filter((x, i, all) => all.indexOf(x) === i)
        .concat(broken && breakX !== null ? [margin.left + breakX - BREAK_GAP / 2] : [])
        .map((x) => (
          <rect
            key={x}
            x={x - POST_WIDTH / 2}
            y={postTop}
            width={POST_WIDTH}
            height={baseY - postTop}
            fill={postFill}
            stroke={edge}
            strokeWidth="0.6"
          />
        ))}

      {broken && breakX !== null && (
        <g className="stroke-foreground" strokeOpacity="0.6" strokeWidth="1" fill="none">
          {[-4, 4].map((offset) => {
            const x = margin.left + breakX + offset;
            const top = postTop - 4;
            const mid = (top + baseY) / 2;
            return (
              <path
                key={offset}
                d={`M ${x} ${top} L ${x} ${mid - 6} L ${x + 4} ${mid - 2} L ${x - 4} ${mid + 2} L ${x} ${mid + 6} L ${x} ${baseY + 4}`}
              />
            );
          })}
        </g>
      )}

      {variant !== 'mini' && (
        <g
          className="fill-primary stroke-primary"
          style={{ fontStretch: '78%' }}
          fontSize="11"
          fontWeight="600"
        >
          <g strokeWidth="0.8" strokeOpacity="0.55">
            <line x1={x0} x2={x0} y1={postTop - 4} y2={18} />
            <line x1={xEnd} x2={xEnd} y1={postTop - 4} y2={18} />
          </g>
          <line x1={x0 - 6} x2={xEnd + 6} y1={22} y2={22} strokeWidth="1" />
          <Tick x={x0} y={22} />
          <Tick x={xEnd} y={22} />
          <text x={(x0 + xEnd) / 2} y={16} textAnchor="middle" stroke="none">
            {formatMeters(soldLengthMm)}
            {broken ? ` · ${plural(panels, 'tela', 'telas')}` : ''}
          </text>

          <g strokeWidth="0.8" strokeOpacity="0.55">
            <line x1={x0 - 4} x2={22} y1={panelTop} y2={panelTop} />
            <line x1={x0 - 14} x2={22} y1={baseY} y2={baseY} />
          </g>
          <line x1={26} x2={26} y1={panelTop - 6} y2={baseY + 6} strokeWidth="1" />
          <Tick x={26} y={panelTop} />
          <Tick x={26} y={baseY} />
          <text
            x={18}
            y={(panelTop + baseY) / 2}
            textAnchor="middle"
            stroke="none"
            transform={`rotate(-90 18 ${(panelTop + baseY) / 2})`}
          >
            {formatMeters(heightMm)}
          </text>

          {broken && breakX !== null && (
            <text x={margin.left + breakX} y={baseY + 17} textAnchor="middle" stroke="none">
              +{plural(hiddenPanels, 'tela', 'telas')}
            </text>
          )}

          {panels > 1 && (
            <g>
              <line
                x1={x0 - 4}
                x2={x0 + PANEL + 4}
                y1={baseY + 24}
                y2={baseY + 24}
                strokeWidth="1"
                strokeOpacity="0.8"
              />
              <Tick x={x0} y={baseY + 24} />
              <Tick x={x0 + PANEL} y={baseY + 24} />
              <text
                x={x0 + PANEL / 2}
                y={baseY + 38}
                textAnchor="middle"
                stroke="none"
                fillOpacity="0.85"
              >
                {formatMeters(PANEL_LENGTH_MM)} por tela
              </text>
            </g>
          )}

          {requestedX !== null && requestedLengthMm !== undefined && (
            <text x={xEnd} y={baseY + 38} textAnchor="end" stroke="none">
              sobra {formatMeters(surplusMm)}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}

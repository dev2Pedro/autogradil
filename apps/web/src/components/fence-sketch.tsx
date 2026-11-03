'use client';

import { useId } from 'react';
import { HEIGHTS_MM, type FenceColor, type HeightMm } from '@autogradil/shared';
import { formatMeters } from '@/lib/labels';

const PANEL_WIDTH = 48;
const POST_WIDTH = 6;
const GAP_WIDTH = 120;
const MAX_FENCE_HEIGHT = 120;
const POST_EXTRA = 8;
const TOP = 28;
const PADDING = 8;
const FULL_LIMIT = 200;
const EDGE_PANELS = 100;

const FILL_BY_COLOR: Record<FenceColor, string> = {
  none: '#a1a1aa',
  white: '#ffffff',
  black: '#18181b',
  green: '#15803d',
};

const HATCH_BY_COLOR: Record<FenceColor, string> = {
  none: '#52525b',
  white: '#71717a',
  black: '#a1a1aa',
  green: '#bbf7d0',
};

const panelFormat = new Intl.NumberFormat('pt-BR');

type SketchItem =
  | { type: 'post'; x: number }
  | { type: 'panel'; x: number }
  | { type: 'gap'; x: number; hiddenPanels: number };

export function buildSketchLayout(panels: number): { items: SketchItem[]; width: number } {
  const items: SketchItem[] = [];
  let x = PADDING;

  const addPanels = (count: number) => {
    for (let index = 0; index < count; index++) {
      items.push({ type: 'post', x });
      x += POST_WIDTH;
      items.push({ type: 'panel', x });
      x += PANEL_WIDTH;
    }
    items.push({ type: 'post', x });
    x += POST_WIDTH;
  };

  if (panels <= FULL_LIMIT) {
    addPanels(panels);
  } else {
    addPanels(EDGE_PANELS);
    items.push({ type: 'gap', x, hiddenPanels: panels - EDGE_PANELS * 2 });
    x += GAP_WIDTH;
    addPanels(EDGE_PANELS);
  }

  return { items, width: x + PADDING };
}

type FenceSketchProps = {
  panels: number;
  posts: number;
  heightMm: HeightMm;
  color: FenceColor;
};

export function FenceSketch({ panels, posts, heightMm, color }: FenceSketchProps) {
  const patternId = useId();
  const { items, width } = buildSketchLayout(panels);
  const fenceHeight = Math.round((heightMm / Math.max(...HEIGHTS_MM)) * MAX_FENCE_HEIGHT);
  const baseY = TOP + MAX_FENCE_HEIGHT + POST_EXTRA;
  const panelY = baseY - fenceHeight;
  const postY = panelY - POST_EXTRA;
  const svgHeight = baseY + PADDING;
  const heightLabel = formatMeters(heightMm);
  const panelsLabel = `${panelFormat.format(panels)} ${panels === 1 ? 'tela' : 'telas'}`;
  const postsLabel = `${panelFormat.format(posts)} ${posts === 1 ? 'poste' : 'postes'}`;

  return (
    <figure className="space-y-2">
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <svg
          role="img"
          aria-label={`Desenho da cerca: ${panelsLabel}, ${postsLabel}, altura ${heightLabel}`}
          width={width}
          height={svgHeight}
          viewBox={`0 0 ${width} ${svgHeight}`}
          className="block text-foreground"
        >
          <defs>
            <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill={FILL_BY_COLOR[color]} />
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke={HATCH_BY_COLOR[color]}
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <text x={PADDING} y={TOP - 10} className="fill-current text-xs">
            Altura: {heightLabel}
          </text>

          <line
            x1={PADDING}
            x2={width - PADDING}
            y1={baseY}
            y2={baseY}
            stroke="currentColor"
            strokeOpacity="0.3"
          />

          {items.map((item, index) => {
            if (item.type === 'panel') {
              return (
                <rect
                  key={index}
                  data-kind="panel"
                  x={item.x}
                  y={panelY}
                  width={PANEL_WIDTH}
                  height={fenceHeight}
                  fill={`url(#${patternId})`}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              );
            }
            if (item.type === 'post') {
              return (
                <rect
                  key={index}
                  data-kind="post"
                  x={item.x}
                  y={postY}
                  width={POST_WIDTH}
                  height={baseY - postY}
                  fill={FILL_BY_COLOR[color]}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              );
            }
            return (
              <text
                key={index}
                x={item.x + GAP_WIDTH / 2}
                y={panelY + fenceHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-xs"
              >
                … +{panelFormat.format(item.hiddenPanels)} telas …
              </text>
            );
          })}
        </svg>
      </div>
      <figcaption className="text-sm text-muted-foreground">
        {panelsLabel} e {postsLabel}, altura {heightLabel}
        {panels > FULL_LIMIT ? '. O desenho mostra as 100 primeiras e as 100 últimas telas.' : '.'}
      </figcaption>
    </figure>
  );
}

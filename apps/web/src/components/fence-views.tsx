'use client';

import dynamic from 'next/dynamic';
import type { FenceCalculation, FenceColor } from '@autogradil/shared';
import { FenceElevation } from '@/components/fence-elevation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Fence3D = dynamic(() => import('@/components/fence-3d').then((module) => module.Fence3D), {
  ssr: false,
  loading: () => <Skeleton className="h-80 sm:h-96" />,
});

type FenceViewsProps = {
  calculation: FenceCalculation;
  color: FenceColor;
};

export function FenceViews({ calculation, color }: FenceViewsProps) {
  const { components, heightMm, soldLengthMm, requestedLengthMm, differenceMm } = calculation;
  const elevation = {
    panels: components.panels,
    heightMm,
    color,
    soldLengthMm,
    requestedLengthMm,
  };

  return (
    <Tabs defaultValue="drawing">
      <TabsList>
        <TabsTrigger value="drawing">Desenho cotado</TabsTrigger>
        <TabsTrigger value="3d">Visualização 3D</TabsTrigger>
      </TabsList>
      <TabsContent value="drawing">
        <figure className="space-y-3 rounded-xl border bg-sheet p-4 sm:p-6">
          <FenceElevation {...elevation} variant="compact" className="h-auto w-full sm:hidden" />
          <FenceElevation
            {...elevation}
            className="mx-auto hidden h-auto max-h-96 w-full sm:block"
          />
          <figcaption className="text-xs text-muted-foreground">
            Vista frontal, sem escala.
            {components.panels > 3
              ? ' Trechos longos são encurtados no meio, com as telas omitidas indicadas na quebra.'
              : ''}
            {differenceMm > 0 ? ' A área hachurada é a sobra da última tela.' : ''}
          </figcaption>
        </figure>
      </TabsContent>
      <TabsContent value="3d">
        <div className="overflow-hidden rounded-xl border">
          <Fence3D
            panels={components.panels}
            posts={components.posts}
            heightMm={heightMm}
            color={color}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

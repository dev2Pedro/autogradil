'use client';

import dynamic from 'next/dynamic';
import type { FenceColor, HeightMm } from '@autogradil/shared';
import { FenceSketch } from '@/components/fence-sketch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Fence3D = dynamic(() => import('@/components/fence-3d').then((module) => module.Fence3D), {
  ssr: false,
  loading: () => <Skeleton className="h-80 sm:h-96" />,
});

type FenceViewsProps = {
  panels: number;
  posts: number;
  heightMm: HeightMm;
  color: FenceColor;
};

export function FenceViews(props: FenceViewsProps) {
  return (
    <Tabs defaultValue="sketch">
      <TabsList>
        <TabsTrigger value="sketch">Desenho 2D</TabsTrigger>
        <TabsTrigger value="3d">Visualização 3D</TabsTrigger>
      </TabsList>
      <TabsContent value="sketch">
        <FenceSketch {...props} />
      </TabsContent>
      <TabsContent value="3d">
        <div className="overflow-hidden rounded-xl border">
          <Fence3D {...props} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

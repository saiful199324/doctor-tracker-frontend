import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoctorDetailView } from './doctor-detail-view';

export const metadata: Metadata = { title: 'Doctor' };

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <DoctorDetailView id={id} />
    </Suspense>
  );
}

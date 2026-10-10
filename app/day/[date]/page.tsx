import ClientOnly from '@/components/client-only'
import { notFound } from 'next/navigation'
import DayView from '@/components/day-view'
import { DAY_BY_DATE } from '@/data/curriculum'

export default async function DayPage({ params }: PageProps<'/day/[date]'>) {
  const { date } = await params
  if (!DAY_BY_DATE[date]) notFound()
  return <ClientOnly>
      <DayView date={date} />
    </ClientOnly>
}

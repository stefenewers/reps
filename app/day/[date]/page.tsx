import ClientOnly from '@/components/client-only'
import { notFound } from 'next/navigation'
import DayView from '@/components/day-view'
import { DAY_BY_DATE, LAST_DAY } from '@/data/curriculum'
import { addDays } from '@/lib/dates'

export default async function DayPage({ params }: PageProps<'/day/[date]'>) {
  const { date } = await params
  // Sprint and plan dates are known; if the pace slips, the forecast can run a few months past the last planned day.
  const real = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
  if (!DAY_BY_DATE[date] && !(real && date > LAST_DAY && date <= addDays(LAST_DAY, 150))) notFound()
  return <ClientOnly>
      <DayView date={date} />
    </ClientOnly>
}

import DayView from '@/components/day-view'

export default async function DayPage({ params }: PageProps<'/day/[date]'>) {
  const { date } = await params
  return <DayView date={date} />
}

import DaySummary from '@/components/day-summary'

export const metadata = { title: 'Reps complete' }

export default async function SummaryPage({ params }: PageProps<'/day/[date]/summary'>) {
  const { date } = await params
  return <DaySummary date={date} />
}

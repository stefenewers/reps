import MockSession from '@/components/mock-session'

export const metadata = { title: 'Mock interview' }

export default async function MockPage({ params }: PageProps<'/interview/[mockId]'>) {
  const { mockId } = await params
  return <MockSession mockId={mockId} />
}

import SkillDetail from '@/components/skill-detail'

export default async function SkillPage({ params }: PageProps<'/skills/[id]'>) {
  const { id } = await params
  return <SkillDetail id={id} />
}

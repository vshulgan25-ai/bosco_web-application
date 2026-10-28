import { ScholarTable } from '@/components/ScholarTable'
import { ACADEMIC_YEAR, getClient, getScholarRows } from '@/lib/payload'

export const metadata = { title: 'Стипендіати · Bosco Center' }

export default async function ScholarsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year: requested } = await searchParams
  const payload = await getClient()
  const all = await payload.find({
    collection: 'scholarships', where: { visible: { equals: true } }, depth: 0, pagination: false, select: { academicYear: true },
  })
  const years = [...new Set(all.docs.map((s: any) => s.academicYear as string))].sort().reverse()
  const year = requested || years[0] || ACADEMIC_YEAR
  const rows = await getScholarRows(year)

  return (
    <>
      <h1>Стипендіати {year}</h1>
      <p className="muted">Учні Центру професійної освіти Боско, яким призначено стипендію за рішенням комісії.</p>
      {years.length > 1 && (
        <form method="get" className="filters">
          <select name="year" defaultValue={year}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          <button className="btn sm" type="submit">Показати</button>
        </form>
      )}
      <ScholarTable rows={rows} />
    </>
  )
}

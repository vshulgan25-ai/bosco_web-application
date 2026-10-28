const KIND_LABEL: Record<string, string> = {
  tuition: 'Навчання в закладі',
  collegium: 'Колегіум',
  cafe: 'Харчування в кафе',
}

export function ScholarTable({ rows }: { rows: { student: any; programs: any[] }[] }) {
  return (
    <div className="scroll">
      <table className="scholars">
        <thead>
          <tr><th>Стипендіат</th><th>Група</th><th>Курс</th><th>Види стипендії</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={4} className="muted">Список стипендіатів поки порожній.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.student.id}>
              <td><strong>{r.student.lastName} {r.student.firstName}</strong></td>
              <td>{r.student.group || '—'}</td>
              <td>{r.student.course || '—'}</td>
              <td>
                {r.programs.map((p: any) => (
                  <span key={p.id} className={`chip ${p.kind}`}>{KIND_LABEL[p.kind] ?? p.name}</span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

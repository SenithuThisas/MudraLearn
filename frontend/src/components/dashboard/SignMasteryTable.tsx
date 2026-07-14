import { useState } from 'react'
import { categoryColor, type SignMasteryRow } from '../../data/mockDashboard'

interface SignMasteryTableProps {
  rows: SignMasteryRow[]
}

const PAGE_SIZE = 6

export default function SignMasteryTable({ rows }: SignMasteryTableProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const categories = ['All', ...new Set(rows.map((r) => r.category))]

  const filtered = rows.filter((r) => {
    const matchesQuery = r.sign.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All' || r.category === category
    return matchesQuery && matchesCategory
  })

  const visible = filtered.slice(0, visibleCount)

  return (
    <div style={{ background: '#ffffff', border: '2px solid #14213D', boxShadow: '4px 4px 0px #14213D', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#14213D', margin: 0 }}>
          SIGN MASTERY
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search signs..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE) }}
            style={{
              padding: '8px 12px', border: '2px solid #14213D', fontFamily: "'Inter', sans-serif", fontSize: 13,
              outline: 'none', minWidth: 160,
            }}
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setVisibleCount(PAGE_SIZE) }}
            style={{
              padding: '8px 12px', border: '2px solid #14213D', fontFamily: "'Inter', sans-serif", fontSize: 13,
              background: '#ffffff', outline: 'none',
            }}
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ width: 48, height: 3, background: '#6D28D9', marginBottom: 20 }} />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif", fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #14213D' }}>
              {['Sign Name', 'Category', 'Tier', 'Mastery Level', 'Score'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.sign} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#14213D' }}>{row.sign}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', background: categoryColor(row.category), border: '1px solid #14213D' }}>
                    {row.category}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', border: '1px solid #14213D', color: '#14213D' }}>
                    {row.tier}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', minWidth: 140 }}>
                  <div style={{ height: 10, background: '#F3F4F6', border: '1px solid #14213D' }}>
                    <div style={{ width: `${row.mastery}%`, height: '100%', background: '#6D28D9' }} />
                  </div>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#14213D' }}>{row.mastery}%</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: '#6B7280' }}>
                  No signs match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {visibleCount < filtered.length && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            style={{
              background: '#ffffff', color: '#14213D', border: '2px solid #14213D', padding: '10px 24px',
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            LOAD MORE
          </button>
        </div>
      )}
    </div>
  )
}

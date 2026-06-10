import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import SignCard from '../components/SignCard'
interface Sign { name: string; category: string }
export default function DictionaryPage() {
const [signs, setSigns] = useState<Sign[]>([])
const [query, setQuery] = useState('')
const [category, setCategory] = useState('All')
useEffect(() => {
fetch('/signs_data.json')
.then(r => r.json())
.then(d => setSigns(d.signs))
}, [])
const categories = ['All', ...new Set(signs.map(s => s.category))]
const filtered = signs.filter(s => {
const matchQuery = s.name.toLowerCase().includes(query.toLowerCase())
const matchCategory = category === 'All' || s.category === category
return matchQuery && matchCategory
})
return (
<div className='min-h-screen bg-gray-50'>
<Navigation />
<div className='max-w-5xl mx-auto px-6 py-8'>
<h1 className='text-2xl font-bold text-gray-900 mb-6'>
Sign Dictionary
</h1>
{/* Search bar */}
<input
type='text'
placeholder='Search signs...'
value={query}
onChange={e => setQuery(e.target.value)}
className='w-full border rounded-lg px-4 py-2 mb-4
focus:outline-none focus:ring-2 focus:ring-blue-500'
/>
{/* Category filter */}
<div className='flex flex-wrap gap-2 mb-6'>
{categories.map(cat => (
<button key={cat}
onClick={() => setCategory(cat)}
className={`px-3 py-1 rounded-full text-sm font-medium
transition-colors ${category === cat
? 'bg-blue-600 text-white'
: 'bg-white border text-gray-600 hover:bg-gray-50'}`}
>
{cat}
</button>
))}
</div>
{/* Results count */}
<p className='text-sm text-gray-500 mb-4'>
Showing {filtered.length} of {signs.length} signs
</p>
{/* Sign grid */}
<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
{filtered.map(s => (
<SignCard key={s.name} name={s.name} category={s.category} />
))}
</div>
</div>
</div>
)
}

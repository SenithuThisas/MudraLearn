import { Link, useLocation } from 'react-router-dom'
export default function Navigation() {
const { pathname } = useLocation()
const linkClass = (path: string) =>
`px-4 py-2 rounded-lg font-medium transition-colors ${
pathname === path
? 'bg-blue-600 text-white'
: 'text-gray-600 hover:bg-gray-100'
}`
return (
<nav className='bg-white shadow-sm border-b px-6 py-3 flex gap-4 items-center'>
<span className='font-bold text-blue-700 text-lg mr-4'>MudraLearn</span>
<Link to='/' className={linkClass('/')}>Home</Link>
<Link to='/dictionary' className={linkClass('/dictionary')}>Dictionary</Link>
<Link to='/practice' className={linkClass('/practice')}>Practice</Link>
</nav>
)
}
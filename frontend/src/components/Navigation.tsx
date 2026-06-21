import { Link, useLocation } from 'react-router-dom'

export default function Navigation() {
  const { pathname } = useLocation()
  
  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      pathname === path
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`

  return (
    <nav className='bg-white dark:bg-[#1f2028] shadow-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex gap-4 items-center'>
      <span className='font-bold text-blue-700 dark:text-blue-400 text-xl mr-4'>MudraLearn</span>
      <Link to='/' className={linkClass('/')}>Home</Link>
      <Link to='/translate' className={linkClass('/translate')}>Translate</Link>
      <Link to='/dictionary' className={linkClass('/dictionary')}>Dictionary</Link>
    </nav>
  )
}
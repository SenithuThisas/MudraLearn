interface SignCardProps {
name: string
category: string
}
export default function SignCard({ name, category }: SignCardProps) {
return (
<div className='bg-white rounded-xl border border-gray-200 p-4
hover:shadow-md transition-shadow cursor-pointer'>
<div className='text-xs text-blue-600 font-medium mb-1 uppercase
tracking-wide'>
{category}
</div>
<div className='text-gray-900 font-semibold text-sm'>{name}</div>
</div>
)
}
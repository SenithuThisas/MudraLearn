import Navigation from '../components/Navigation'
import WebcamCapture from '../components/WebcamCapture'
export default function PracticePage() {
return (
<div className='min-h-screen bg-gray-50'>
<Navigation />
<div className='max-w-xl mx-auto px-6 py-10 flex flex-col items-center gap-6'>
<h1 className='text-2xl font-bold text-gray-900'>Practice</h1>
<p className='text-gray-500 text-sm text-center'>
Perform a sign in front of your webcam and press Start.
</p>
<WebcamCapture />
</div>
</div>
)
}
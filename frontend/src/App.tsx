import { Link } from 'react-router-dom';
import Navigation from './components/Navigation';

function App() {
  return (
    <div className="w-full flex-1 bg-gray-50 dark:bg-[#16171d] font-sans">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-20 px-6 text-center">
        <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
          Learn Sign Language with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          MudraLearn uses advanced computer vision to recognise over 200 sign language gestures in real-time directly from your webcam.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/translate" 
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            Start Translating
          </Link>
          <Link 
            to="/dictionary" 
            className="px-8 py-4 bg-white dark:bg-[#1f2028] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            View Dictionary
          </Link>
        </div>
      </main>
    </div>
  );
}

export default App;

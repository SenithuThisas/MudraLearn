import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import DictionaryPage from './pages/DictionaryPage'
import './index.css'
import PracticePage from './pages/PracticePage'
ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<BrowserRouter>
<Routes>
<Route path='/' element={<App />} />
<Route path='/practice' element={<PracticePage />} />
<Route path='/dictionary' element={<DictionaryPage />} />
</Routes>
</BrowserRouter>
</React.StrictMode>
)
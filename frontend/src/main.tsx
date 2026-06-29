import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DictionaryPage from './pages/DictionaryPage'
import TranslatePage from './pages/TranslatePage'
import './index.css'
import PracticePage from './pages/PracticePage'

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<BrowserRouter>
<Routes>
<Route path='/' element={<LandingPage />} />
<Route path='/translate' element={<TranslatePage />} />
<Route path='/practice' element={<PracticePage />} />
<Route path='/dictionary' element={<DictionaryPage />} />
</Routes>
</BrowserRouter>
</React.StrictMode>
)

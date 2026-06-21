import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import DictionaryPage from './pages/DictionaryPage'
import TranslatePage from './pages/TranslatePage'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<BrowserRouter>
<Routes>
<Route path='/' element={<App />} />
<Route path='/translate' element={<TranslatePage />} />
<Route path='/dictionary' element={<DictionaryPage />} />
</Routes>
</BrowserRouter>
</React.StrictMode>
)
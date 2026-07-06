import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import BlogPage from './pages/BlogPage'
import DictionaryPage from './pages/DictionaryPage'
import TranslatePage from './pages/TranslatePage'
import './index.css'
import PracticePage from './pages/PracticePage'
import SplashPage from './pages/SplashPage'
import SignInPage from './pages/SignInPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import OnboardingNamePage from './pages/OnboardingNamePage'
import OnboardingUsernamePage from './pages/OnboardingUsernamePage'
import DashboardPage from './pages/DashboardPage'

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<BrowserRouter>
<AuthProvider>
<Routes>
<Route path='/' element={<LandingPage />} />
<Route path='/about' element={<AboutPage />} />
<Route path='/blog' element={<BlogPage />} />
<Route path='/translate' element={<TranslatePage />} />
<Route path='/practice' element={<PracticePage />} />
<Route path='/dictionary' element={<DictionaryPage />} />
<Route path='/splash' element={<SplashPage />} />
<Route path='/signin' element={<SignInPage />} />
<Route path='/verify-email' element={<VerifyEmailPage />} />
<Route path='/onboarding/name' element={<OnboardingNamePage />} />
<Route path='/onboarding/username' element={<OnboardingUsernamePage />} />
<Route path='/dashboard' element={<DashboardPage />} />
</Routes>
</AuthProvider>
</BrowserRouter>
</React.StrictMode>
)

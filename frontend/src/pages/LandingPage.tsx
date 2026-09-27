import { MotionConfig } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import WhatIsMudraLearn from '../components/landing/WhatIsMudraLearn';
import HowItWorks from '../components/landing/HowItWorks';
import WhyChoose from '../components/landing/WhyChoose';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden selection:bg-[#B9FBC0] selection:text-[#1a2744]">
        <Navbar />
        <Hero />
        <WhatIsMudraLearn />
        <HowItWorks />
        <WhyChoose />
        <CTA />
        <Footer />
      </main>
    </MotionConfig>
  );
}


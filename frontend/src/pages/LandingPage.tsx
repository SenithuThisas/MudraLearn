import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import WhatIsMudraLearn from '../components/landing/WhatIsMudraLearn';
import HowItWorks from '../components/landing/HowItWorks';
import WhyChoose from '../components/landing/WhyChoose';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <WhatIsMudraLearn />
      <HowItWorks />
      <WhyChoose />
      <CTA />
      <Footer />
    </main>
  );
}

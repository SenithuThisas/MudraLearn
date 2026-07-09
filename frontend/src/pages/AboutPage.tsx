import Navbar from '../components/landing/Navbar';
import AboutHero from '../components/about/AboutHero';
import CommunicationGap from '../components/about/CommunicationGap';
import TheEcosystem from '../components/about/TheEcosystem';
import OurJourney from '../components/about/OurJourney';
import WhoIsThisFor from '../components/about/WhoIsThisFor';
import TechStack from '../components/about/TechStack';
import AboutCTA from '../components/about/AboutCTA';
import Footer from '../components/landing/Footer';

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      {/* Offset for fixed navbar */}
      <div style={{ paddingTop: 64 }}>
        <AboutHero />
        <CommunicationGap />
        <TheEcosystem />
        <OurJourney />
        <WhoIsThisFor />
        <TechStack />
        <AboutCTA />
        <Footer />
      </div>
    </main>
  );
}

import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Team from '../components/Team';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-space-bg">
      <Header />
      <Hero />
      <Features />
      
      <section id="about" className="py-24 bg-space-bg">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-space-textPrimary mb-6 font-[Poppins]">
            About Us
          </h2>
          <p className="text-lg text-space-textSecondary leading-relaxed font-[Inter]">
            We are a NASA-inspired technology startup dedicated to making universe exploration 
            accessible through ultra-high resolution images. Our platform allows users worldwide 
            to discover the mysteries of the cosmos with an unprecedented level of detail.
          </p>
        </div>
      </section>

      <section id="contact" className="py-24 bg-space-bgSecondary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-space-textPrimary mb-6 font-[Poppins]">
            Contact
          </h2>
          <p className="text-lg text-space-textSecondary mb-8 font-[Inter]">
            Have questions or want to collaborate with us?
          </p>
          <a 
            href="mailto:ljfp@ljfp.xyz"
            className="inline-block px-8 py-4 rounded-md text-white font-semibold
                     bg-gradient-to-r from-space-blue to-space-purple
                     hover:opacity-90 transition-opacity shadow-lg shadow-space-blue/30"
            data-testid="link-contact-email"
          >
            Contact Us
          </a>
        </div>
      </section>

      <Team />
      <Footer />
    </div>
  );
}

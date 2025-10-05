import FeatureCard from './FeatureCard';
import { ZoomIn, Image, Sparkles } from 'lucide-react';

export default function Features() {
  return (
    <section 
      id="features" 
      className="py-24 bg-space-bgSecondary relative"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl font-bold text-space-textPrimary mb-4 font-[Poppins]"
            data-testid="text-features-title"
          >
            Features
          </h2>
          <p 
            className="text-lg text-space-textSecondary font-[Inter]"
            data-testid="text-features-subtitle"
          >
            Explore space like never before
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard
            icon={ZoomIn}
            title="Gigapixel Zoom"
            description="Experience infinite zoom capabilities with our advanced gigapixel technology. Navigate seamlessly through ultra-high resolution astronomical images and discover hidden details invisible to the naked eye."
          />
          <FeatureCard
            icon={Image}
            title="NASA Image Library"
            description="Access an extensive curated collection of spectacular space imagery from NASA's archives. From distant galaxies to planetary surfaces, explore the universe's most breathtaking moments captured in stunning detail."
          />
          <FeatureCard
            icon={Sparkles}
            title="Smart Annotations"
            description="Enhance your exploration with intelligent annotations powered by astronomical databases. Identify celestial objects, learn about cosmic phenomena, and dive deep into the science behind each stunning image."
          />
        </div>
      </div>
    </section>
  );
}

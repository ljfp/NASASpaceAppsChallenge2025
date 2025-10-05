import FeatureCard from '../FeatureCard';
import { ZoomIn } from 'lucide-react';

export default function FeatureCardExample() {
  return (
    <div className="p-8 bg-space-bgSecondary">
      <FeatureCard
        icon={ZoomIn}
        title="Zoom Infinito"
        description="Haz zoom infinito y navega por imágenes astronómicas en ultra alta resolución."
      />
    </div>
  );
}

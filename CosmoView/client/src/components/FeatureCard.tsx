import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div 
      className="group relative p-10 rounded-xl backdrop-blur-md 
                 bg-gradient-to-br from-white/5 to-white/0 border border-white/10
                 hover:from-white/10 hover:to-white/5 hover:border-space-blue/40
                 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-space-blue/20
                 hover:-translate-y-2"
      data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-space-blue/5 to-space-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      
      <div className="relative flex flex-col items-center text-center gap-5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-space-blue/20 to-space-purple/20 border border-space-blue/40 
                       group-hover:from-space-blue/30 group-hover:to-space-purple/30 
                       group-hover:border-space-blue/60 transition-all duration-500
                       group-hover:scale-110 group-hover:rotate-3">
          <Icon 
            className="w-10 h-10 text-space-blue group-hover:text-white transition-colors duration-500" 
            strokeWidth={1.5}
            data-testid={`icon-${title.toLowerCase().replace(/\s+/g, '-')}`}
          />
        </div>
        
        <h3 
          className="text-2xl font-bold text-space-textPrimary font-[Poppins] group-hover:text-white transition-colors"
          data-testid={`text-feature-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {title}
        </h3>
        
        <p 
          className="text-space-textSecondary leading-relaxed font-[Inter] text-base group-hover:text-space-textPrimary/90 transition-colors"
          data-testid={`text-feature-description-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

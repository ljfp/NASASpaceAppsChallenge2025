import logoImage from '@assets/Logo 1_1759598642084.png';
import { SiX, SiGithub, SiLinkedin } from 'react-icons/si';

export default function Footer() {
  return (
    <footer className="bg-space-bg border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="w-10 h-10 object-contain"
              data-testid="img-footer-logo"
            />
            <span className="text-lg font-semibold text-space-textPrimary font-[Poppins]">
              SpaceVision
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="#privacy"
              className="text-sm text-space-textSecondary hover:text-space-blue transition-colors"
              data-testid="link-privacy"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-sm text-space-textSecondary hover:text-space-blue transition-colors"
              data-testid="link-terms"
            >
              Terms of Service
            </a>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-blue/70 hover:text-space-blue transition-colors"
              data-testid="link-twitter"
              aria-label="Twitter"
            >
              <SiX className="w-5 h-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-blue/70 hover:text-space-blue transition-colors"
              data-testid="link-github"
              aria-label="GitHub"
            >
              <SiGithub className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-blue/70 hover:text-space-blue transition-colors"
              data-testid="link-linkedin"
              aria-label="LinkedIn"
            >
              <SiLinkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-space-textSecondary font-[Inter]">
            © 2025 SpaceVision. Exploring the universe together.
          </p>
        </div>
      </div>
    </footer>
  );
}

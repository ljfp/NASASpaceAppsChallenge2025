import logoImage from '@assets/Logo 1_1759598642084.png';

export default function Header() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-space-bg/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="w-10 h-10 object-contain"
              data-testid="img-logo"
            />
            <span className="text-xl font-semibold text-space-textPrimary font-[Poppins]">
              SpaceVision
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-space-textSecondary hover:text-space-blue transition-colors text-sm font-medium"
              data-testid="link-features"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-space-textSecondary hover:text-space-blue transition-colors text-sm font-medium"
              data-testid="link-about"
            >
              About Us
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-space-textSecondary hover:text-space-blue transition-colors text-sm font-medium"
              data-testid="link-contact"
            >
              Contact
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default function Hero() {
  const handleExploreUniverse = () => {
    window.location.assign('/aladin');
  };

  const handleUploadPhoto = () => {
    console.log('Upload your own photo clicked');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-b from-space-bg to-space-bgSecondary"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5,
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-bg/40 to-space-bgSecondary" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-32">
        <h1 
          className="text-5xl md:text-7xl font-bold text-space-textPrimary mb-6 font-[Poppins] leading-tight"
          data-testid="text-hero-title"
        >
          Explore the Universe
        </h1>
        
        <p 
          className="text-lg md:text-xl text-space-textSecondary mb-12 max-w-3xl mx-auto leading-relaxed font-[Inter]"
          data-testid="text-hero-subtitle"
        >
          View NASA images in ultra detail and venture into the depths of space.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleExploreUniverse}
            className="px-10 py-5 rounded-md text-white font-bold text-lg
                     bg-gradient-to-r from-space-blue to-space-purple
                     hover:opacity-90 hover:scale-105 transition-all shadow-2xl shadow-space-blue/40
                     border border-space-blue/50"
            data-testid="button-explore-universe"
          >
            Explore the Universe
          </button>
          
          <button
            onClick={handleUploadPhoto}
            className="px-8 py-4 rounded-md text-space-blue font-semibold text-base
                     border-2 border-space-blue bg-space-blue/10 backdrop-blur-sm
                     hover:bg-space-blue/20 transition-colors"
            data-testid="button-upload-photo"
          >
            Upload your own photo
          </button>
        </div>
      </div>
    </section>
  );
}

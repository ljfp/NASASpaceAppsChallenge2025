import { Users } from 'lucide-react';

export default function Team() {
  const teamMembers = [
    "Salah Eddine",
    "Sergi Juarez Perez",
    "Victor Aguayo",
    "Lautaro Javier Fernandez Pricco",
    "Roger Marin"
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-space-bgSecondary to-space-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-space-blue/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-space-blue/20 border border-space-blue/40">
              <Users className="w-6 h-6 text-space-blue" strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-space-textPrimary mb-4 font-[Poppins]">
            Meet Our Team
          </h2>
          
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-space-blue" />
            <p className="text-xl text-space-blue font-mono font-semibold">
              0x42_EOF
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-space-blue" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-xl backdrop-blur-md 
                       bg-gradient-to-br from-white/5 to-white/0 border border-white/10
                       hover:from-white/10 hover:to-white/5 hover:border-space-blue/40
                       transition-all duration-500 hover:-translate-y-1"
              data-testid={`card-team-member-${index}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-space-blue/5 to-space-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
              
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-space-blue/30 to-space-purple/30 border border-space-blue/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <span className="text-space-blue font-bold text-lg font-[Poppins]">
                    {member.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <p 
                    className="text-space-textPrimary font-semibold font-[Poppins] group-hover:text-white transition-colors"
                    data-testid={`text-member-name-${index}`}
                  >
                    {member}
                  </p>
                  <p className="text-xs text-space-textSecondary font-[Inter] mt-1">
                    Team Member
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

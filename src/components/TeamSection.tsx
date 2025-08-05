import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const TeamSection = () => {
  const team = [
    {
      name: "Ikta Sollork",
      role: "Founder / CEO",
      image: "/placeholder.svg",
      initials: "IS"
    },
    {
      name: "Gwen Chase",
      role: "Marketing",
      image: "/placeholder.svg",
      initials: "GC"
    },
    {
      name: "James Bond",
      role: "Designer",
      image: "/placeholder.svg",
      initials: "JB"
    },
    {
      name: "Jenny Will",
      role: "SEO / Others",
      image: "/placeholder.svg",
      initials: "JW"
    },
    {
      name: "Jan Wink",
      role: "Web Developer",
      image: "/placeholder.svg",
      initials: "JW"
    },
    {
      name: "Lilli Math",
      role: "Designer",
      image: "/placeholder.svg",
      initials: "LM"
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Amazing Team
          </h2>
          <p className="text-lg font-medium text-gray-800 italic">
            Care, without the chaos
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div key={index} className="text-center group">
              {/* Avatar */}
              <Avatar className="w-32 h-32 mx-auto mb-6 group-hover:scale-105 transition-transform">
                <AvatarImage src={member.image} alt={member.name} />
                <AvatarFallback className="bg-brand-blue text-white text-2xl font-semibold">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {member.name}
              </h3>
              
              <p className="text-gray-600">
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
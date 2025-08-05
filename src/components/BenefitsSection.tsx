import { Smartphone, Settings, Shield, Bell, TrendingUp, ArrowRightLeft } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Smartphone,
      title: "Streamlined Integration",
      description: "Real-time syncing across devices."
    },
    {
      icon: Settings,
      title: "Customizable Solutions",
      description: "Adapts to your child's changing care needs."
    },
    {
      icon: Shield,
      title: "Secure and Reliable",
      description: "Enterprise-grade data protection."
    },
    {
      icon: Bell,
      title: "Alerts and Reminders",
      description: "Know every dose given—or not."
    },
    {
      icon: TrendingUp,
      title: "Enhanced Symptom Tracking",
      description: "Replace guesswork with clear patterns."
    },
    {
      icon: ArrowRightLeft,
      title: "Seamless Transitions",
      description: "Export/import care data across settings."
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Choose NaviKinder?
          </h2>
          <p className="text-lg font-medium text-gray-800 italic">
            Care, without the chaos
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center group">
                {/* Icon */}
                <div className="w-16 h-16 bg-brand-blue-light rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-8 h-8 text-brand-blue" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
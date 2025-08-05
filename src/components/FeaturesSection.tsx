import { Camera, Activity, Users } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Camera,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "Medication Tracker",
      subtitle: "Snap a photo – we'll handle the rest.",
      description: "Take a photo of a medication label, hospital list, or bottle — our tool will enter the information for you.",
      benefits: [
        "No typing. No errors. Fast, accurate entry.",
        "Track medications, dosages, and times.",
        "Get alerts and mark as 'given' or note why it wasn't."
      ]
    },
    {
      icon: Activity,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      title: "Symptom Tracking",
      subtitle: "Log symptoms, interventions, and outcomes.",
      description: "See patterns and understand what works.",
      benefits: [
        "Designed for clarity, not clutter."
      ]
    },
    {
      icon: Users,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      title: "Seamless Collaboration",
      subtitle: "Share medication lists and symptom logs between carers and care locations.",
      description: "Reduce risk of medication errors.",
      benefits: [
        "Stay connected and informed."
      ]
    }
  ];

  return (
    <section id="features" className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            All Features in One Tool
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-background p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                {/* Icon */}
                <div className={`w-12 h-12 ${feature.iconBg} rounded-lg flex items-center justify-center mb-6`}>
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-brand-blue font-medium mb-3">
                  {feature.subtitle}
                </p>
                
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                {/* Benefits List */}
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="text-gray-600 text-sm leading-relaxed">
                      • {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
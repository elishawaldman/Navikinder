import { Calendar, Hospital, Users, FileText } from 'lucide-react';

const IntegrationsSection = () => {
  const integrations = [
    {
      icon: Calendar,
      title: "Appointment Tracking",
      description: "Sync with your calendar apps"
    },
    {
      icon: Hospital,
      title: "Healthcare Systems",
      description: "Connect with hospital portals"
    },
    {
      icon: Users,
      title: "Care Team Sharing",
      description: "Collaborate with caregivers"
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "Export reports for doctors"
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Seamless Integrations
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Coordinate Medications, Symptom Management, and Appointments Across Settings
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <div key={index} className="bg-gray-50 p-6 rounded-xl text-center hover:bg-background hover:shadow-md transition-all group">
                {/* Icon */}
                <div className="w-12 h-12 bg-brand-blue-light rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-brand-blue" />
                </div>
                
                {/* Content */}
                <h3 className="font-semibold text-gray-900 mb-2">
                  {integration.title}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {integration.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
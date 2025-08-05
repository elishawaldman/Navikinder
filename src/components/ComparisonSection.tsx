import { Check, X } from 'lucide-react';

const ComparisonSection = () => {
  const features = [
    {
      feature: "Effortless medication data entry",
      navikinder: true,
      others: false
    },
    {
      feature: "Medication reminders + delivery confirmation or reason",
      navikinder: true,
      others: false
    },
    {
      feature: "Advanced symptom tracking",
      navikinder: true,
      others: false
    },
    {
      feature: "Share access between carers",
      navikinder: true,
      others: false
    },
    {
      feature: "Export lists to reduce errors",
      navikinder: true,
      others: false
    },
    {
      feature: "User-friendly interface",
      navikinder: true,
      others: false
    },
    {
      feature: "Outdated/complex interface",
      navikinder: false,
      others: true
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why NaviKinder Stands Out
          </h2>
          <p className="text-lg text-gray-600">
            See how we compare against others in performance and reliability.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-background rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold text-gray-900">Feature</div>
              <div className="text-center">
                <div className="font-semibold text-brand-blue">NaviKinder</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">Others</div>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {features.map((item, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Feature Name */}
                  <div className="text-gray-900 font-medium">
                    {item.feature}
                  </div>
                  
                  {/* NaviKinder */}
                  <div className="text-center">
                    {item.navikinder ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                        <X className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Others */}
                  <div className="text-center">
                    {item.others ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                        <X className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;

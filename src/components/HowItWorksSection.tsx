const HowItWorksSection = () => {
  const steps = [
    {
      number: "1",
      image: "/how-it-works-icon-1.png",
      title: "Upload Your Medications",
      description: "Take a photo of prescription labels or medication bottles. Our AI will automatically extract all the details."
    },
    {
      number: "2", 
      image: "/how-it-works-icon-2.png",
      title: "Review and Organize",
      description: "Verify the extracted information and set up your medication schedule with custom reminders."
    },
    {
      number: "3",
      image: "/how-it-works-icon-3.png",
      title: "Get Alerts When Doses Are Due",
      description: "Alerts sound when a dose is due. Quickly record if it was given or not—and why."
    }
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How NaviKinder Works
          </h2>
          <p className="text-lg font-medium text-gray-800 italic">
            Care, without the chaos
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-2/3 h-0.5 bg-gray-200"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {/* Step Number */}
                <div className="w-12 h-12 bg-brand-blue text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-6 relative z-10">
                  {step.number}
                </div>
                
                {/* Image */}
                <div className="w-24 h-24 bg-background rounded-xl shadow-sm flex items-center justify-center mx-auto mb-6 overflow-hidden">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
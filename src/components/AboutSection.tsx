import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AboutSection = () => {
  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Section Label */}
          <p className="text-sm font-semibold text-brand-blue tracking-wide uppercase mb-8">
            INTRODUCING NAVIKINDER
          </p>
          
          {/* Quote */}
          <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-medium text-gray-900 leading-relaxed mb-8">
            "Built with compassion, we understand the challenges of managing children with medical complexity. Our tool is designed to streamline your daily routines and to provide peace of mind."
          </blockquote>
          
          {/* Attribution */}
          <div className="flex items-center justify-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/placeholder.svg" alt="Elisha Waldman" />
              <AvatarFallback className="bg-brand-blue text-white text-lg font-semibold">EW</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-lg">Elisha Waldman</p>
              <p className="text-gray-600">Parent, Physician, and Founder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
import { CheckCircle, Clock, Calendar, Zap, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartNow = () => {
    if (user) {
      // User is logged in, scroll to features or navigate to dashboard
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // User is not logged in, navigate to auth page
      navigate('/auth');
    }
  };
  return (
    <section className="bg-gradient-hero py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Content */}
        <div className="text-center mb-12 lg:mb-16">
          {/* Trust Badge */}
          <div className="flex items-center justify-center space-x-2 bg-blue-100 px-4 py-2 rounded-full mb-8 inline-flex">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-blue-600 text-sm font-medium">Trusted by thousands of families</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 font-heading">
            Simplify Complex Care,
            <span className="text-brand-blue block">One Dose at a Time</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-4 max-w-4xl mx-auto">
            Track meds, symptoms, and appointments — all in one tool designed for managing 
            medical complexity.
          </p>

          {/* Supporting Line */}
          <p className="text-lg font-medium text-gray-800 italic mb-8">
            Care, without the chaos.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-16">
            <Button 
              size="lg" 
              onClick={handleStartNow}
              className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {user ? 'Explore Features' : 'Start Now'}
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Log Dose */}
          <div className="bg-gradient-to-br from-green-50 to-green-50 p-6 rounded-xl border border-green-100 hover:border-green-200 transition-all group">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">Log Dose</h3>
              <p className="text-sm text-gray-600">Record medication given</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-50 p-6 rounded-xl border border-blue-100 hover:border-blue-200 transition-all group">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">Schedule</h3>
              <p className="text-sm text-gray-600">View today's doses</p>
            </div>
          </div>

          {/* PRN */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-50 p-6 rounded-xl border border-purple-100 hover:border-purple-200 transition-all group">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">PRN</h3>
              <p className="text-sm text-gray-600">As-needed medications</p>
            </div>
          </div>

          {/* History */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-50 p-6 rounded-xl border border-orange-100 hover:border-orange-200 transition-all group">
            <div className="text-center">
              <History className="w-8 h-8 mx-auto text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 mb-1">History</h3>
              <p className="text-sm text-gray-600">View past doses</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
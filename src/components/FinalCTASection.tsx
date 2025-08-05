import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const FinalCTASection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartNow = () => {
    if (user) {
      // User is logged in, scroll to top or navigate to dashboard
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // User is not logged in, navigate to auth page
      navigate('/auth');
    }
  };
  return (
    <section className="py-16 lg:py-20 bg-gradient-cta">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Be the First to Experience the Difference With NaviKinder
        </h2>
        
        {/* CTA Button */}
        <div className="mb-8">
          <Button 
            size="lg" 
            onClick={handleStartNow}
            className="bg-background text-brand-blue hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
          >
            {user ? 'Get Started' : 'Start Now'}
          </Button>
        </div>
        
        {/* Contact Email */}
        <div className="flex items-center justify-center space-x-2 text-blue-100">
          <Mail className="w-5 h-5" />
          <a 
            href="mailto:support@navikinder.com" 
            className="hover:text-white transition-colors"
          >
            support@navikinder.com
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
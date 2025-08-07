import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardContent } from '@/components/DashboardContent';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { PushNotificationSetup } from '@/components/PushNotificationSetup';
import { EmailReminderModal } from '@/components/EmailReminderModal';

const Overview = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileLoading, setProfileLoading] = useState(true);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderDoseInstanceId, setReminderDoseInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      checkProfileCompletion();
    }
  }, [user, loading, navigate]);

  // Handle email reminder URL parameter
  useEffect(() => {
    if (user && !profileLoading) {
      const reminderParam = searchParams.get('reminder');
      if (reminderParam) {
        setReminderDoseInstanceId(reminderParam);
        setReminderModalOpen(true);
        // Clean up URL parameter
        setSearchParams({});
      }
    }
  }, [user, profileLoading, searchParams, setSearchParams]);

  const checkProfileCompletion = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .single();
      
      // If user doesn't have a display_name, redirect to welcome
      if (!profile?.display_name) {
        navigate('/welcome');
        return;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      // If there's an error fetching profile, redirect to welcome to be safe
      navigate('/welcome');
      return;
    } finally {
      setProfileLoading(false);
    }
  };

  const handleReminderModalClose = () => {
    setReminderModalOpen(false);
    setReminderDoseInstanceId(null);
  };

  const handleReminderConfirm = () => {
    // Optional: Refresh the dashboard content to show updated medication status
    // This could trigger a refresh of DueMedicationsSection
    setReminderModalOpen(false);
    setReminderDoseInstanceId(null);
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 max-w-full overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 space-y-6">
            <PWAInstallPrompt />
            {/* <PushNotificationSetup /> */}
          </div>
          <DashboardContent />
        </main>
      </div>

      {/* Email Reminder Modal */}
      {reminderDoseInstanceId && (
        <EmailReminderModal
          open={reminderModalOpen}
          onClose={handleReminderModalClose}
          doseInstanceId={reminderDoseInstanceId}
          onConfirm={handleReminderConfirm}
        />
      )}
    </SidebarProvider>
  );
};

export default Overview;
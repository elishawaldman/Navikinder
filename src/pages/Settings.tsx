import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { TimezoneSelector } from '@/components/TimezoneSelector';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  medication_reminders_enabled: boolean;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { isSupported: isPushSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications_enabled: true,
    push_notifications_enabled: true,
    medication_reminders_enabled: true,
  });
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);



  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    if (!user) return;

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || '');
    }

    // Load notification settings
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      setNotificationSettings({
        email_notifications_enabled: settings.email_notifications_enabled,
        push_notifications_enabled: settings.push_notifications_enabled,
        medication_reminders_enabled: settings.medication_reminders_enabled,
      });
    } else {
      // Create default settings if they don't exist
      await supabase
        .from('user_notification_settings')
        .insert({
          user_id: user.id,
          ...notificationSettings
        });
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updateNotificationSettings = async (key: keyof NotificationSettings, value: boolean) => {
    if (!user) return;

    setIsUpdatingNotifications(true);
    const newSettings = { ...notificationSettings, [key]: value };
    
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .update(newSettings)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotificationSettings(newSettings);

      // Handle push notification subscription
      if (key === 'push_notifications_enabled' && isPushSupported) {
        if (value && !isSubscribed) {
          await subscribe();
        } else if (!value && isSubscribed) {
          await unsubscribe();
        }
      }

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc('delete_user_account');

      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeletingAccount(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
              {isMobile && <SidebarTrigger className="mr-4" />}
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Manage your personal information and account details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your email address cannot be changed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                    <Button
                      onClick={updateProfile}
                      disabled={isUpdatingProfile}
                      size="sm"
                    >
                      {isUpdatingProfile ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <TimezoneSelector 
                  onTimezoneChange={(timezone) => {
                    toast({
                      title: "Timezone updated",
                      description: `Your timezone has been set to ${timezone}. Medication reminders will now show the correct local time.`,
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications and reminders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_notifications_enabled}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings('email_notifications_enabled', checked)
                    }
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <Separator />

                {/* Push Notifications toggle hidden - will be re-enabled later */}
                {/* <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      {isPushSupported 
                        ? 'Receive push notifications on this device'
                        : 'Push notifications are not supported on this device'
                      }
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.push_notifications_enabled}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings('push_notifications_enabled', checked)
                    }
                    disabled={isUpdatingNotifications || !isPushSupported}
                  />
                </div> */}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Medication Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded when medications are due
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.medication_reminders_enabled}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings('medication_reminders_enabled', checked)
                    }
                    disabled={isUpdatingNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Push notification debug components removed - will be re-enabled later */}

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Shield className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full sm:w-auto"
                      disabled={isDeletingAccount}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers, including:
                        <br />
                        <br />
                        • Your profile and personal information
                        <br />
                        • All children profiles and medication data
                        <br />
                        • Medication schedules and dose history
                        <br />
                        • Notification preferences
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeletingAccount}
                      >
                        {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
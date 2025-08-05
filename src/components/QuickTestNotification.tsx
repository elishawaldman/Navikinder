/**
 * QuickTestNotification.tsx
 * 
 * Purpose: Simple test notification button for production mobile debugging
 * Location: /src/components/QuickTestNotification.tsx
 * 
 * This component provides a quick way to send test notifications
 * for debugging purposes, available in production.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';

export const QuickTestNotification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendQuickTest = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const testPayload = {
        dose_instance_id: `quick-test-${Date.now()}`,
        due_datetime: new Date().toISOString(),
        dose_amount: 1,
        dose_unit: 'test',
        medication_name: 'Test Notification',
        child_name: 'Test',
        parent_email: user.email,
        parent_name: user.user_metadata?.full_name || 'Test User'
      };

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: testPayload
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test Sent!",
        description: `Notification sent. Check Service Worker Logs below for details.`,
      });

      console.log('Quick test result:', data);
    } catch (error: any) {
      console.error('Quick test error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Quick Test
        </CardTitle>
        <CardDescription>
          Send a test notification to debug push notification issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={sendQuickTest} 
          disabled={isLoading || !user?.email}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Notification
            </>
          )}
        </Button>
        {!user?.email && (
          <p className="text-sm text-muted-foreground mt-2">
            Please log in to send test notifications
          </p>
        )}
      </CardContent>
    </Card>
  );
};
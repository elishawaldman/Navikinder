/**
 * PushNotificationTest.tsx
 * 
 * Purpose: Test component for manually triggering push notifications
 * Location: /src/components/PushNotificationTest.tsx
 * 
 * This component provides manual controls to test push notification functionality
 * without relying on the medication reminder system.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, TestTube } from 'lucide-react';

export const PushNotificationTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    medication_name: 'Test Medicine',
    child_name: 'Test Child',
    dose_amount: 5,
    dose_unit: 'ml',
    parent_email: '',
    parent_name: 'Test Parent'
  });
  const { toast } = useToast();

  const sendTestNotification = async () => {
    if (!testData.parent_email) {
      toast({
        title: "Email Required",
        description: "Please enter a parent email to test with",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const testPayload = {
        dose_instance_id: `test-${Date.now()}`,
        due_datetime: new Date().toISOString(),
        dose_amount: testData.dose_amount,
        dose_unit: testData.dose_unit,
        medication_name: testData.medication_name,
        child_name: testData.child_name,
        parent_email: testData.parent_email,
        parent_name: testData.parent_name
      };

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: testPayload
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test Sent",
        description: `Push notification test completed. Sent: ${data?.sent || 0}, Failed: ${data?.failed || 0}`,
      });

      console.log('Test notification result:', data);
    } catch (error: any) {
      console.error('Test notification error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*');

      if (error) throw error;

      toast({
        title: "Subscriptions Check",
        description: `Found ${data?.length || 0} push subscriptions in database`,
      });

      console.log('Push subscriptions:', data);
    } catch (error: any) {
      console.error('Subscription check error:', error);
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check subscriptions",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Push Notification Testing
        </CardTitle>
        <CardDescription>
          Manual controls to test push notification functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parent_email">Parent Email</Label>
            <Input
              id="parent_email"
              type="email"
              value={testData.parent_email}
              onChange={(e) => setTestData(prev => ({ ...prev, parent_email: e.target.value }))}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <Label htmlFor="medication_name">Medication Name</Label>
            <Input
              id="medication_name"
              value={testData.medication_name}
              onChange={(e) => setTestData(prev => ({ ...prev, medication_name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="child_name">Child Name</Label>
            <Input
              id="child_name"
              value={testData.child_name}
              onChange={(e) => setTestData(prev => ({ ...prev, child_name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="dose_amount">Dose Amount</Label>
            <Input
              id="dose_amount"
              type="number"
              value={testData.dose_amount}
              onChange={(e) => setTestData(prev => ({ ...prev, dose_amount: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={sendTestNotification}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            {isLoading ? "Sending..." : "Send Test Notification"}
          </Button>
          
          <Button
            onClick={checkSubscriptions}
            variant="outline"
          >
            Check Subscriptions
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Note:</strong> Make sure you have:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Enabled push notifications first</li>
            <li>A valid user profile with the test email</li>
            <li>VAPID keys configured in environment variables</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
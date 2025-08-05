import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight, User, Baby } from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface Child {
  first_name: string;
  date_of_birth: string;
}

const Welcome = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Personal info
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>("");
  
  // Children info
  const [children, setChildren] = useState<Child[]>([{ first_name: "", date_of_birth: "" }]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    
    // Check if user already completed welcome flow
    if (user) {
      checkWelcomeStatus();
    }
  }, [user, loading, navigate]);

  const checkWelcomeStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .single();
      
      // If user already has a display_name, redirect to overview
      if (profile?.display_name) {
        navigate('/overview');
      }
    } catch (error) {
      console.error('Error checking welcome status:', error);
    }
  };

  const addChild = () => {
    setChildren([...children, { first_name: "", date_of_birth: "" }]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: keyof Child, value: string) => {
    const updatedChildren = [...children];
    updatedChildren[index][field] = value;
    setChildren(updatedChildren);
  };

  const handlePersonalInfoNext = () => {
    if (!displayName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!user) return;
    
    // Validate at least one child has a name
    const validChildren = children.filter(child => child.first_name.trim());
    if (validChildren.length === 0) {
      toast({
        title: "Child Information Required",
        description: "Please add at least one child to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          phone_number: phoneNumber || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create children and relationships using RPC call to avoid RLS conflicts
      for (const child of validChildren) {
        // Use RPC function to create child and relationship in one transaction
        const { data: childId, error } = await supabase.rpc('create_child_with_relationship', {
          p_first_name: child.first_name.trim(),
          p_date_of_birth: child.date_of_birth || null,
          p_profile_id: user.id
        });

        if (error) {
          console.error('Error creating child with RPC:', error);
          throw error;
        }
      }

      toast({
        title: "Welcome Setup Complete!",
        description: "Your profile has been created successfully.",
      });

      navigate('/overview');
    } catch (error: any) {
      console.error('Error completing welcome flow:', error);
      toast({
        title: "Setup Error",
        description: error.message || "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto pt-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to MedTracker</h1>
          <p className="text-muted-foreground">Let's set up your profile to get started</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <User size={16} />
            </div>
            <div className={`w-8 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <Baby size={16} />
            </div>
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Tell us about yourself to personalize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="US"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="Enter your phone number"
                  className="phone-input"
                />
                <p className="text-sm text-muted-foreground">
                  Used for SMS reminders and notifications. Include your country code.
                </p>
              </div>

              <Button 
                onClick={handlePersonalInfoNext}
                className="w-full"
                size="lg"
              >
                Continue to Child Information
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Children Information */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Children Information</CardTitle>
              <CardDescription>
                Add your children to track their medications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {children.map((child, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Child {index + 1}</h4>
                    {children.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                      <Input
                        id={`firstName-${index}`}
                        value={child.first_name}
                        onChange={(e) => updateChild(index, 'first_name', e.target.value)}
                        placeholder="Child's first name"
                        className="text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`dob-${index}`}>Date of Birth</Label>
                      <Input
                        id={`dob-${index}`}
                        type="date"
                        value={child.date_of_birth}
                        onChange={(e) => updateChild(index, 'date_of_birth', e.target.value)}
                        className="text-base"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addChild}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Child
              </Button>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Setting up..." : "Complete Setup"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Welcome;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, User, Baby } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  display_name: string;
  phone_number: string;
}

interface Child {
  id: string;
  first_name: string;
  date_of_birth: string;
  notes?: string;
}

const displayNameSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(50, 'Display name must be less than 50 characters'),
});

const childSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  notes: z.string().optional(),
});

type DisplayNameForm = z.infer<typeof displayNameSchema>;
type ChildForm = z.infer<typeof childSchema>;

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [addingChild, setAddingChild] = useState(false);

  const displayNameForm = useForm<DisplayNameForm>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: {
      display_name: '',
    },
  });

  const childForm = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      first_name: '',
      date_of_birth: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchProfileData();
    }
  }, [user, loading, navigate]);

  const fetchProfileData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      displayNameForm.reset({ display_name: profileData.display_name || '' });

      // Fetch children
      const { data: childrenData, error: childrenError } = await supabase
        .from('child_profiles')
        .select(`
          children (
            id,
            first_name,
            date_of_birth,
            notes
          )
        `)
        .eq('profile_id', user?.id);

      if (childrenError) throw childrenError;
      
      const childrenList = childrenData?.map(cp => cp.children).filter(Boolean) || [];
      setChildren(childrenList as Child[]);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const updateDisplayName = async (data: DisplayNameForm) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: data.display_name })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, display_name: data.display_name } : null);
      setEditingProfile(false);
      toast({
        title: "Success",
        description: "Display name updated successfully.",
      });
    } catch (error) {
      console.error('Error updating display name:', error);
      toast({
        title: "Error",
        description: "Failed to update display name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveChild = async (data: ChildForm) => {
    try {
      if (editingChild) {
        // Update existing child
        const { error } = await supabase
          .from('children')
          .update({
            first_name: data.first_name,
            date_of_birth: data.date_of_birth,
            notes: data.notes || null,
          })
          .eq('id', editingChild.id);

        if (error) throw error;

        setChildren(prev => prev.map(child => 
          child.id === editingChild.id 
            ? { ...child, ...data }
            : child
        ));
        setEditingChild(null);
      } else {
        // Add new child
        const { data: newChild, error: createError } = await supabase
          .rpc('create_child_with_relationship', {
            p_first_name: data.first_name,
            p_date_of_birth: data.date_of_birth,
            p_profile_id: user?.id
          });

        if (createError) throw createError;

        // Fetch the created child to get full data
        const { data: childData, error: fetchError } = await supabase
          .from('children')
          .select('*')
          .eq('id', newChild)
          .single();

        if (fetchError) throw fetchError;

        setChildren(prev => [...prev, childData]);
        setAddingChild(false);
      }

      childForm.reset();
      toast({
        title: "Success",
        description: editingChild ? "Child updated successfully." : "Child added successfully.",
      });
    } catch (error) {
      console.error('Error saving child:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingChild ? 'update' : 'add'} child. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const deleteChild = async (childId: string) => {
    try {
      // Delete child-profile relationship
      const { error: relationError } = await supabase
        .from('child_profiles')
        .delete()
        .eq('child_id', childId)
        .eq('profile_id', user?.id);

      if (relationError) throw relationError;

      setChildren(prev => prev.filter(child => child.id !== childId));
      toast({
        title: "Success",
        description: "Child removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting child:', error);
      toast({
        title: "Error",
        description: "Failed to remove child. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditChild = (child: Child) => {
    setEditingChild(child);
    childForm.reset({
      first_name: child.first_name,
      date_of_birth: child.date_of_birth,
      notes: child.notes || '',
    });
  };

  const openAddChild = () => {
    setAddingChild(true);
    setEditingChild(null);
    childForm.reset({
      first_name: '',
      date_of_birth: '',
      notes: '',
    });
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">Profile</h1>
            </div>
          </header>
          <main className="flex-1 max-w-full overflow-x-hidden">
            <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
            {/* Profile Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Profile Information</CardTitle>
                      <p className="text-sm text-muted-foreground">Manage your account details</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingProfile(true)}
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm bg-muted/30 p-3 rounded-md">{profile.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                    <p className="text-sm bg-muted/30 p-3 rounded-md">{profile.display_name || 'Not set'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Children Management */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Baby className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Children</CardTitle>
                      <p className="text-sm text-muted-foreground">Manage children in your care</p>
                    </div>
                  </div>
                  <Button 
                    onClick={openAddChild}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {children.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="mx-auto w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                      <Baby className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No children added yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">Add a child to start tracking their medications</p>
                    <Button onClick={openAddChild} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Child
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        {children.length} child{children.length !== 1 ? 'ren' : ''} in your care
                      </p>
                    </div>
                    <div className="space-y-3">
                      {children.map((child) => (
                        <Card key={child.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Baby className="h-4 w-4 text-primary" />
                                  </div>
                                  <h3 className="font-semibold text-lg truncate">{child.first_name}</h3>
                                </div>
                                <div className="space-y-1 ml-10">
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span className="font-medium">Born:</span>
                                    <span>{new Date(child.date_of_birth).toLocaleDateString()}</span>
                                  </p>
                                  {child.notes && (
                                    <p className="text-sm text-muted-foreground">
                                      <span className="font-medium">Notes:</span> {child.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 sm:flex-col sm:gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditChild(child)}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Pencil className="h-4 w-4 sm:mr-0 mr-2" />
                                  <span className="sm:hidden">Edit</span>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                                      <span className="sm:hidden">Remove</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="mx-4 max-w-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Child</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove <strong>{child.first_name}</strong> from your profile? 
                                        This will also remove all associated medication data and cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteChild(child.id)}
                                        className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </main>
        </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...displayNameForm}>
            <form onSubmit={displayNameForm.handleSubmit(updateDisplayName)} className="space-y-4">
              <FormField
                control={displayNameForm.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your display name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingProfile(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Child Dialog */}
      <Dialog open={addingChild || !!editingChild} onOpenChange={(open) => {
        if (!open) {
          setAddingChild(false);
          setEditingChild(null);
        }
      }}>
        <DialogContent className="mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChild ? 'Edit Child' : 'Add Child'}</DialogTitle>
          </DialogHeader>
          <Form {...childForm}>
            <form onSubmit={childForm.handleSubmit(saveChild)} className="space-y-4">
              <FormField
                control={childForm.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter child's first name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Any additional notes about the child" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setAddingChild(false);
                    setEditingChild(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingChild ? 'Update Child' : 'Add Child'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default Profile;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from '@/hooks/useTheme';
import { Sidebar } from '@/components/Sidebar';

const Settings: React.FC = () => {
  const [displayName, setDisplayName] = useState('Anonymous User');
  const [status, setStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=user1');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const userCount = 127; // Mock data

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real implementation, we would upload the file to a server
    // and get back a URL. For this demo, we'll use a simulated delay.
    setIsUploading(true);
    
    // Check file size and type
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "File too large",
        description: "Avatar must be less than 5MB",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }
    
    // Simulate upload delay
    setTimeout(() => {
      // Use a random seed for the avatar to simulate a new image
      const newSeed = Math.random().toString(36).substring(2, 9);
      const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`;
      setAvatarUrl(newAvatarUrl);
      setIsUploading(false);
      
      toast({
        title: "Avatar updated",
        description: "Your profile has been updated successfully",
      });
    }, 1500);
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile saved",
      description: "Your profile has been updated successfully",
    });
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="chromacall-theme">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex">
        {/* Sidebar */}
        <Sidebar
          currentView="settings"
          onViewChange={() => {}} // We'll update this later to handle navigation
          userCount={userCount}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information and how you appear to others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-center">
                    <Label htmlFor="avatar-upload" className="cursor-pointer text-primary hover:underline">
                      {isUploading ? "Uploading..." : "Change avatar"}
                    </Label>
                    <Input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input 
                    id="display-name" 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select 
                    id="status" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={status}
                    onChange={e => setStatus(e.target.value as 'online' | 'busy' | 'offline')}
                  >
                    <option value="online">Online</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Appear Offline</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Manage your account's privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Allow friend requests</h3>
                    <p className="text-sm text-muted-foreground">
                      Let people send you friend requests
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    defaultChecked={true}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show online status</h3>
                    <p className="text-sm text-muted-foreground">
                      Let others see when you're online
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    defaultChecked={true}
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Account deleted",
                        description: "Your account and all data have been deleted",
                        variant: "destructive",
                      });
                    }}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Settings;

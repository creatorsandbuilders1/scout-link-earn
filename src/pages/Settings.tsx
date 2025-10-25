import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, Lock, Bell, Wallet, Crown, 
  Link2, X, Check, DollarSign, Loader2, AlertCircle, Upload
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const { stacksAddress } = useWallet();
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    username: '',
    fullName: '',
    avatarUrl: '',
    headline: '',
    about: '',
    talentAvailability: true,
  });
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  // Universal Finder's Fee state
  const [universalFinderFee, setUniversalFinderFee] = useState(10);
  const [feeLastChanged, setFeeLastChanged] = useState<string | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "wallet", label: "Wallet & Payments", icon: Wallet },
    { id: "membership", label: "Membership", icon: Crown },
  ];

  // Fetch profile data and universal finder fee when viewing profile section
  useEffect(() => {
    if (activeSection === 'profile' && stacksAddress) {
      fetchProfileData();
      fetchUniversalFee();
    }
  }, [activeSection, stacksAddress]);

  const fetchProfileData = async () => {
    if (!stacksAddress) return;

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', stacksAddress)
        .single();

      if (error || !data) {
        console.error('[SETTINGS] Error fetching profile:', error);
        toast.error('Failed to load profile data');
        return;
      }

      setProfileData({
        username: data.username,
        fullName: data.full_name || '',
        avatarUrl: data.avatar_url || '',
        headline: data.headline || '',
        about: data.about || '',
        talentAvailability: data.talent_availability ?? true,
      });
      setOriginalUsername(data.username);
    } catch (error) {
      console.error('[SETTINGS] Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username === originalUsername) {
      setUsernameAvailable(true);
      return;
    }

    if (username.length < 3) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('[SETTINGS] Error checking username:', error);
        setUsernameAvailable(null);
        return;
      }

      setUsernameAvailable(!data);
    } catch (error) {
      console.error('[SETTINGS] Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setProfileData({ ...profileData, username: sanitized });
    
    if (sanitized.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!stacksAddress) return;

    // Validation
    if (profileData.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (profileData.username !== originalUsername && !usernameAvailable) {
      toast.error('Username is not available');
      return;
    }

    setProfileSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            stacksAddress,
            username: profileData.username,
            fullName: profileData.fullName || null,
            avatarUrl: profileData.avatarUrl || null,
            headline: profileData.headline || null,
            about: profileData.about || null,
            talentAvailability: profileData.talentAvailability,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error('Failed to save profile', {
          description: result.error || 'Please try again',
        });
        return;
      }

      toast.success('Profile updated!', {
        description: 'Your changes have been saved',
      });

      // Refresh data
      fetchProfileData();
    } catch (error) {
      console.error('[SETTINGS] Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    if (!stacksAddress) {
      toast.error('Wallet not connected');
      return;
    }

    setAvatarUploading(true);

    try {
      // Step 1: Get authenticated JWT for storage operations
      console.log('[SETTINGS] Fetching auth JWT for storage...');
      const jwtResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-auth-jwt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            stacksAddress,
          }),
        }
      );

      const jwtResult = await jwtResponse.json();

      if (!jwtResponse.ok || !jwtResult.success) {
        throw new Error(jwtResult.error || 'Failed to get authentication token');
      }

      console.log('[SETTINGS] Auth JWT obtained:', jwtResult.jwt);

      // Step 2: Create temporary authenticated Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const tempSupabaseClient = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${jwtResult.jwt}`
            }
          }
        }
      );

      console.log('[SETTINGS] Temporary authenticated client created');

      // Step 3: Generate filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${stacksAddress}/avatar-${Date.now()}.${fileExt}`;

      // Step 4: Upload to Supabase Storage using temporary client
      const { data, error } = await tempSupabaseClient.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      console.log('[SETTINGS] Avatar uploaded:', data.path);

      // Step 5: Get public URL
      const { data: { publicUrl } } = tempSupabaseClient.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Step 6: Update form state
      setProfileData({...profileData, avatarUrl: publicUrl});
      
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('[SETTINGS] Avatar upload error:', error);
      toast.error('Failed to upload avatar', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const fetchUniversalFee = async () => {
    if (!stacksAddress) return;

    setFeeLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('universal_finder_fee, fee_last_changed_at')
        .eq('id', stacksAddress)
        .single();

      if (error) {
        console.error('[SETTINGS] Error fetching fee:', error);
        return;
      }

      if (data) {
        setUniversalFinderFee(data.universal_finder_fee || 10);
        setFeeLastChanged(data.fee_last_changed_at);
      }
    } catch (error) {
      console.error('[SETTINGS] Error fetching fee:', error);
    } finally {
      setFeeLoading(false);
    }
  };

  const handleSaveFee = async () => {
    if (!stacksAddress) return;

    setFeeSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            stacksAddress,
            universalFinderFee,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 429) {
        // Rate limit error
        toast.error('Rate Limit Reached', {
          description: result.error,
        });
        return;
      }

      if (!response.ok || !result.success) {
        toast.error('Failed to update fee', {
          description: result.error || 'Please try again',
        });
        return;
      }

      toast.success('Finder\'s Fee updated!', {
        description: `Your universal fee is now ${universalFinderFee}%`,
      });

      // Refresh fee data
      fetchUniversalFee();
    } catch (error) {
      console.error('[SETTINGS] Error saving fee:', error);
      toast.error('Failed to update fee');
    } finally {
      setFeeSaving(false);
    }
  };

  const getDaysUntilNextChange = () => {
    if (!feeLastChanged) return null;
    
    const lastChanged = new Date(feeLastChanged).getTime();
    const now = Date.now();
    const daysSince = (now - lastChanged) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.ceil(3 - daysSince);
    
    return daysRemaining > 0 ? daysRemaining : 0;
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div>
          <h1 className="text-4xl font-black mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Navigation */}
          <aside className="lg:col-span-1">
            <Card className="shadow-soft sticky top-20">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* PROFILE SECTION */}
            {activeSection === "profile" && (
              <>
                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Basic Profile</CardTitle>
                    <CardDescription>Update your public profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {profileLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={profileData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stacksAddress}`} />
                            <AvatarFallback>
                              {(profileData.fullName || profileData.username)[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              disabled={avatarUploading}
                              className="cursor-pointer"
                            />
                            {avatarUploading && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                              </div>
                            )}
                            <p className="text-sm text-muted-foreground">
                              JPG, PNG or GIF. Max size 2MB.
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Form Fields */}
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Full Name</Label>
                              <Input 
                                value={profileData.fullName}
                                onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                                maxLength={100}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Username <span className="text-destructive">*</span></Label>
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  @
                                </div>
                                <Input 
                                  value={profileData.username}
                                  onChange={(e) => handleUsernameChange(e.target.value)}
                                  className="pl-8 pr-10"
                                  required
                                  minLength={3}
                                  maxLength={30}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {checkingUsername && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  )}
                                  {!checkingUsername && usernameAvailable === true && (
                                    <Check className="h-4 w-4 text-success" />
                                  )}
                                  {!checkingUsername && usernameAvailable === false && profileData.username.length >= 3 && (
                                    <X className="h-4 w-4 text-destructive" />
                                  )}
                                </div>
                              </div>
                              {usernameAvailable === false && profileData.username.length >= 3 && profileData.username !== originalUsername && (
                                <p className="text-xs text-destructive">
                                  Username is already taken
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input 
                              value={profileData.headline}
                              onChange={(e) => setProfileData({...profileData, headline: e.target.value})}
                              placeholder="e.g., Full-Stack Developer | UI/UX Designer"
                              maxLength={200}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>About</Label>
                            <Textarea 
                              value={profileData.about}
                              onChange={(e) => setProfileData({...profileData, about: e.target.value})}
                              placeholder="Tell the world about yourself..."
                              className="min-h-[120px]"
                              maxLength={1000}
                            />
                            <p className="text-xs text-muted-foreground">
                              {profileData.about.length}/1000 characters
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Default Profile View</Label>
                            <Select defaultValue="talent">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="talent">Talent</SelectItem>
                                <SelectItem value="scout">Scout</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Which role visitors see first on your profile
                            </p>
                          </div>
                        </div>

                        <Button 
                          onClick={handleSaveProfile}
                          disabled={profileSaving || (profileData.username !== originalUsername && !usernameAvailable)}
                          className="bg-action hover:bg-action/90"
                        >
                          {profileSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Social Verifications</CardTitle>
                    <CardDescription>Connect your social accounts to build trust</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { platform: 'Twitter', connected: true },
                      { platform: 'GitHub', connected: true },
                      { platform: 'Website', connected: false },
                    ].map((social) => (
                      <div key={social.platform} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded">
                            <Link2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{social.platform}</p>
                            {social.connected && (
                              <p className="text-sm text-success flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Connected
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant={social.connected ? "outline" : "default"}>
                          {social.connected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Talent Settings</CardTitle>
                    <CardDescription>Configure your availability and skills</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profileLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Available for Work</Label>
                            <p className="text-sm text-muted-foreground">
                              Show your availability status to potential clients
                            </p>
                          </div>
                          <Switch 
                            checked={profileData.talentAvailability}
                            onCheckedChange={(checked) => setProfileData({...profileData, talentAvailability: checked})}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>Skills</Label>
                          <Input placeholder="Add skills (press enter to add)" />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {['UI/UX Design', 'Figma', 'Web3', 'Motion Graphics'].map((skill) => (
                              <Badge key={skill} variant="secondary" className="gap-1">
                                {skill}
                                <X className="h-3 w-3 cursor-pointer" />
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Skills management coming soon
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Universal Finder's Fee</CardTitle>
                    <CardDescription>Set your commission rate for all Scout referrals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {feeLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="finderFee">Scout Commission</Label>
                            <span className="text-3xl font-bold text-success">
                              {universalFinderFee}%
                            </span>
                          </div>
                          <Slider
                            id="finderFee"
                            value={[universalFinderFee]}
                            onValueChange={(value) => setUniversalFinderFee(value[0])}
                            min={0}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                          <p className="text-sm text-muted-foreground">
                            This fee applies to ALL work Scouts bring to you (custom projects and gigs)
                          </p>
                        </div>

                        {getDaysUntilNextChange() !== null && getDaysUntilNextChange()! > 0 && (
                          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-semibold text-warning">Rate Limit Active</p>
                              <p className="text-muted-foreground">
                                You can change your fee again in {getDaysUntilNextChange()} day{getDaysUntilNextChange() !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleSaveFee}
                          disabled={feeSaving}
                          className="w-full bg-action hover:bg-action/90"
                        >
                          {feeSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Save Finder's Fee
                            </>
                          )}
                        </Button>

                        <div className="pt-4 border-t space-y-3 text-sm">
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-success/10 rounded">
                              <Check className="h-4 w-4 text-success" />
                            </div>
                            <div>
                              <p className="font-semibold">Commission Locking</p>
                              <p className="text-muted-foreground">
                                When a Scout refers a client, your current fee is locked for that relationship
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-success/10 rounded">
                              <Check className="h-4 w-4 text-success" />
                            </div>
                            <div>
                              <p className="font-semibold">Rate Limiting</p>
                              <p className="text-muted-foreground">
                                Fee can only be changed once every 3 days to ensure stability
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* ACCOUNT SECTION */}
            {activeSection === "account" && (
              <>
                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Connected Wallet</CardTitle>
                    <CardDescription>Your Stacks blockchain wallet</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">Wallet Address</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          SP2J6Z...8H9K2
                        </p>
                      </div>
                      <Button variant="outline">Disconnect</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Email</CardTitle>
                    <CardDescription>Optional email for notifications and recovery</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" placeholder="your@email.com" />
                    </div>
                    <Button>Update Email</Button>
                  </CardContent>
                </Card>

                <Card className="shadow-elevated border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive">
                      Deactivate Account
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === "notifications" && (
              <Card className="shadow-elevated">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { label: 'New direct messages', inApp: true, email: true },
                    { label: 'Scout recommendations', inApp: true, email: false },
                    { label: 'New matching jobs', inApp: true, email: true },
                    { label: 'Milestone approvals', inApp: true, email: true },
                    { label: 'Weekly activity summary', inApp: false, email: true },
                  ].map((notif, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <Label>{notif.label}</Label>
                      </div>
                      <div className="flex gap-6 ml-4">
                        <div className="flex items-center gap-2">
                          <Switch defaultChecked={notif.inApp} />
                          <span className="text-sm text-muted-foreground">In-App</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch defaultChecked={notif.email} />
                          <span className="text-sm text-muted-foreground">Email</span>
                        </div>
                      </div>
                      {i < 4 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* WALLET SECTION */}
            {activeSection === "wallet" && (
              <>
                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Withdrawal Methods</CardTitle>
                    <CardDescription>Manage your payout wallet addresses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Stacks Wallet Address</Label>
                      <div className="flex gap-2">
                        <Input placeholder="SP..." className="font-mono" />
                        <Button>Add</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Payout Currency</Label>
                      <Select defaultValue="stx">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stx">STX (Stacks)</SelectItem>
                          <SelectItem value="sbtc">sBTC (Bitcoin)</SelectItem>
                          <SelectItem value="usdh">USDh (Stablecoin)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Withdrawal History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">$2,000</p>
                            <p className="text-sm text-muted-foreground">Oct {20 - i}, 2025</p>
                          </div>
                          <Badge>Completed</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* MEMBERSHIP SECTION */}
            {activeSection === "membership" && (
              <>
                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>You're on the Free plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold">Free</h3>
                          <p className="text-sm text-muted-foreground">Perfect for getting started</p>
                        </div>
                        <Badge variant="outline">Current Plan</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span>Unlimited profile views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span>10 proposal credits per month</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span>50 scout recommendations per month</span>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      Upgrade to Pro
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-elevated">
                  <CardHeader>
                    <CardTitle>Proposal Credits</CardTitle>
                    <CardDescription>Credits used to apply for jobs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Available Credits</p>
                        <p className="text-3xl font-black">8</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Next refill (+10)</p>
                        <p className="font-medium">Nov 1, 2025</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Buy More Credits</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { credits: 10, price: 5 },
                          { credits: 25, price: 10 },
                          { credits: 50, price: 18 },
                        ].map((pack) => (
                          <Card key={pack.credits} className="cursor-pointer hover:border-primary transition-colors">
                            <CardContent className="p-4 text-center">
                              <p className="text-2xl font-bold">{pack.credits}</p>
                              <p className="text-xs text-muted-foreground mb-2">credits</p>
                              <Button size="sm" className="w-full">
                                ${pack.price}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
    </AppLayout>
  );
}

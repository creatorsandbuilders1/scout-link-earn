import { useState } from "react";
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
  Link2, X, Check, AlertCircle
} from "lucide-react";
import { currentUser } from "@/lib/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "wallet", label: "Wallet & Payments", icon: Wallet },
    { id: "membership", label: "Membership", icon: Crown },
  ];

  return (
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
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback>{currentUser.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline">Change Avatar</Button>
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
                          <Input defaultValue={currentUser.full_name} />
                        </div>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input defaultValue={currentUser.username} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Headline</Label>
                        <Input defaultValue={currentUser.headline} />
                      </div>

                      <div className="space-y-2">
                        <Label>About</Label>
                        <Textarea 
                          placeholder="Tell the world about yourself..."
                          className="min-h-[120px]"
                        />
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

                    <Button className="bg-action hover:bg-action/90">
                      Save Changes
                    </Button>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Available for Work</Label>
                        <p className="text-sm text-muted-foreground">
                          Show your availability status to potential clients
                        </p>
                      </div>
                      <Switch defaultChecked={currentUser.talent_availability} />
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
                    </div>
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
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, DollarSign, TrendingUp, Briefcase, Star, X } from "lucide-react";
import { currentUser, mockJobs, mockTalents, getUserById } from "@/lib/mockData";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const greeting = `Good morning, ${currentUser.full_name.split(' ')[0]}`;
  
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-4xl font-black text-foreground mb-2">{greeting}</h1>
        <p className="text-muted-foreground">Here's what's happening with your network</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Action Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Center Widget */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Action Center</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="action" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="action">Action Required</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="action" className="space-y-4 mt-4">
                  {/* Task Item */}
                  <Link to="/contracts/contract-1">
                    <div className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-semibold">Review milestone submission</p>
                        <p className="text-sm text-muted-foreground">Brand Redesign for DeFi Platform</p>
                        <Badge variant="secondary" className="mt-2">Due in 2 days</Badge>
                      </div>
                      <Button size="sm" className="bg-action hover:bg-action/90">
                        Review
                      </Button>
                    </div>
                  </Link>
                  
                  <div className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-semibold">Fund new project escrow</p>
                      <p className="text-sm text-muted-foreground">NFT Marketplace Smart Contracts</p>
                      <Badge variant="secondary" className="mt-2">Urgent</Badge>
                    </div>
                    <Button size="sm" className="bg-action hover:bg-action/90">
                      Fund
                    </Button>
                  </div>
                  
                  <div className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-semibold">Connection request received</p>
                      <p className="text-sm text-muted-foreground">From @new_client_2024</p>
                    </div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="messages" className="space-y-4 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">@user_name_{i}</p>
                          <span className="text-xs text-muted-foreground">2h ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Hey, I'd love to discuss the project details...</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-4 mt-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                    <Star className="h-5 w-5 text-success mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">You received a 5-star review</p>
                      <p className="text-sm text-muted-foreground">From @happy_client on "Brand Redesign" project</p>
                      <span className="text-xs text-muted-foreground">3 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                    <DollarSign className="h-5 w-5 text-success mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Commission paid out</p>
                      <p className="text-sm text-muted-foreground">You earned $180 from connecting @sarah_designs</p>
                      <span className="text-xs text-muted-foreground">Yesterday</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-lg border">
                    <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">@alex_dev connected with you</p>
                      <p className="text-sm text-muted-foreground">New Scout connection established</p>
                      <span className="text-xs text-muted-foreground">2 days ago</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Opportunity Radar (Scout Widget) */}
          <Card className="shadow-elevated border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary">📡</span> Opportunity Radar
              </CardTitle>
              <CardDescription>New jobs matching your roster's skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job Match */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <h3 className="font-bold text-primary">{mockJobs[0].title}</h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">${mockJobs[0].budget_min}-${mockJobs[0].budget_max}</Badge>
                    <Badge variant="outline">{mockJobs[0].duration}</Badge>
                    <Badge variant="outline">{mockJobs[0].level}</Badge>
                  </div>
                </div>
                
                {/* Best Match */}
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mockTalents[1].avatar} />
                    <AvatarFallback>AM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{mockTalents[1].full_name}</p>
                    <p className="text-sm text-muted-foreground">{mockTalents[1].headline}</p>
                  </div>
                  <Badge className="bg-success text-success-foreground">98% Match</Badge>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-action hover:bg-action/90">
                    Recommend {mockTalents[1].full_name.split(' ')[0]}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Link to={`/jobs/${mockJobs[0].id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                  View Details <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financial Widgets */}
        <div className="space-y-6">
          {/* Earnings Snapshot */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Earnings Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Balance */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-4xl font-black text-success">$4,850</p>
                <Button className="w-full bg-action hover:bg-action/90">
                  Withdraw Funds
                </Button>
              </div>
              
              {/* Pending in Escrow */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pending in Escrow</p>
                <p className="text-2xl font-bold">$3,000</p>
              </div>
              
              {/* Last 30 Days */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Earnings (Last 30 Days)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">$8,420</p>
                  <div className="flex items-center text-success text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +12%
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <Link to="/wallet">View Detailed History</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Your Network</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reputation</span>
                <span className="font-bold text-primary">{currentUser.reputation}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Scout Connections</span>
                <span className="font-bold">{currentUser.scout_connections_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Projects Completed</span>
                <span className="font-bold">{currentUser.projects_completed_count}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, Users, Briefcase, Link2, X, Check, ExternalLink,
  Github, Twitter, Globe, DollarSign, Calendar
} from "lucide-react";
import { currentUser, mockTalents, mockServices, getUserById } from "@/lib/mockData";

export default function Profile() {
  const { username } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("talent");
  
  // For demo, use current user or find by username
  const profileUser = username 
    ? mockTalents.find(t => t.username === username) || currentUser
    : currentUser;
  
  const isOwnProfile = profileUser.id === currentUser.id;
  
  // Mock data for profile sections
  const portfolioItems = [
    { id: 1, image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400', title: 'Brand Identity' },
    { id: 2, image: 'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=400', title: 'Logo Design' },
    { id: 3, image: 'https://images.unsplash.com/photo-1634942537909-e2ea8c87e5f3?w=400', title: 'Visual System' },
  ];

  const completedProjects = [
    {
      id: 1,
      title: 'Brand Redesign for DeFi Platform',
      client: { username: 'crypto_client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1' },
      scout: { username: 'network_scout', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scout1' },
      rating: 5,
      review: 'Absolutely phenomenal work! Exceeded all expectations and delivered ahead of schedule.',
      date: '2025-10-15'
    },
    {
      id: 2,
      title: 'NFT Collection Design',
      client: { username: 'nft_founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2' },
      rating: 5,
      review: 'Creative genius. The collection sold out in minutes!',
      date: '2025-09-28'
    },
  ];

  const scoutConnections = [
    {
      id: 1,
      talent: { username: 'sarah_designs', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
      client: { username: 'happy_client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1' },
      project: 'Logo Design Package',
      commission: 180,
      date: '2025-10-20'
    },
    {
      id: 2,
      talent: { username: 'alex_dev', name: 'Alex Martinez', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
      client: { username: 'startup_ceo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2' },
      project: 'Smart Contract Development',
      commission: 450,
      date: '2025-10-12'
    },
  ];

  const roster = mockTalents.slice(0, 4);

  const clientProjects = [
    {
      id: 1,
      title: 'Brand Identity Overhaul',
      talent: { username: 'maya_creates', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya' },
      scout: { username: 'pro_scout', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scout1' },
      completedDate: '2025-10-10',
      review: 'Professional and creative. Would hire again in a heartbeat!'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Universal Header (Connection Card) */}
        <Card className="shadow-elevated mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar with Status Border */}
              <div className="relative">
                <Avatar 
                  className={`h-32 w-32 ring-4 ring-offset-4 ${
                    profileUser.talent_availability 
                      ? 'ring-success' 
                      : 'ring-muted'
                  }`}
                >
                  <AvatarImage src={profileUser.avatar} />
                  <AvatarFallback className="text-3xl">
                    {profileUser.full_name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Identity Block */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-black text-primary mb-1">
                    {profileUser.full_name}
                  </h1>
                  <p className="text-muted-foreground">@{profileUser.username}</p>
                  <p className="mt-2 text-lg">{profileUser.headline}</p>
                </div>

                {/* Metrics Block */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-action" />
                    <span className="font-semibold">Reputation: {profileUser.reputation}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Scout Connections: {profileUser.scout_connections_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span>Projects Completed: {profileUser.projects_completed_count}</span>
                  </div>
                </div>

                {/* Social Verifications */}
                <div className="flex gap-3">
                  <Button variant="outline" size="icon" className="h-9 w-9" title="Twitter">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="GitHub">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="Website">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Connection Button */}
              {!isOwnProfile && (
                <div className="flex items-start">
                  {!isConnected ? (
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setIsConnected(true)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  ) : (
                    <div className="relative group">
                      <Button variant="outline" className="gap-2">
                        <Check className="h-4 w-4" />
                        Connected
                      </Button>
                      <div className="hidden group-hover:block absolute top-full mt-2 right-0 w-48 bg-background border rounded-lg shadow-elevated p-2 z-10">
                        <Button variant="ghost" size="sm" className="w-full justify-start mb-1">
                          <Link2 className="h-4 w-4 mr-2" />
                          Get Referral Link
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={() => setIsConnected(false)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isOwnProfile && (
                <div className="flex items-start">
                  <Button variant="outline">
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            {profileUser.roles.includes('talent') && (
              <TabsTrigger value="talent">Talent</TabsTrigger>
            )}
            {profileUser.roles.includes('scout') && (
              <TabsTrigger value="scout">Scout</TabsTrigger>
            )}
            {profileUser.roles.includes('client') && (
              <TabsTrigger value="client">Client</TabsTrigger>
            )}
          </TabsList>

          {/* TALENT VIEW */}
          <TabsContent value="talent" className="space-y-6">
            <Tabs defaultValue="gallery">
              <TabsList>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="history">History & Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="mt-6">
                {/* Service Posts & Portfolio Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Service Post */}
                  <Card className="overflow-hidden shadow-soft hover:shadow-elevated transition-shadow group cursor-pointer">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600"
                        alt="Service"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1">Brand Identity Package</h3>
                        <p className="text-sm mb-2">Starting at $2,500</p>
                        <Badge className="bg-success text-success-foreground">
                          Finder's Fee: 12%
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Portfolio Items */}
                  {portfolioItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden shadow-soft hover:shadow-elevated transition-shadow group cursor-pointer">
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <p className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6 space-y-4">
                {completedProjects.map((project) => (
                  <Card key={project.id} className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-primary mb-1">{project.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Completed: {project.date}</span>
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(project.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-action text-action" />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.client.avatar} />
                            <AvatarFallback>C</AvatarFallback>
                          </Avatar>
                          <Link to={`/profile/${project.client.username}`} className="text-primary hover:underline">
                            @{project.client.username}
                          </Link>
                        </div>
                        {project.scout && (
                          <>
                            <span className="text-muted-foreground">via</span>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={project.scout.avatar} />
                                <AvatarFallback>S</AvatarFallback>
                              </Avatar>
                              <Link to={`/profile/${project.scout.username}`} className="text-primary hover:underline">
                                @{project.scout.username}
                              </Link>
                            </div>
                          </>
                        )}
                      </div>

                      <p className="text-muted-foreground italic">"{project.review}"</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* SCOUT VIEW */}
          <TabsContent value="scout">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Connection History */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold mb-4">Connection History</h2>
                {scoutConnections.map((connection) => (
                  <Card key={connection.id} className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-sm">
                          <span className="font-semibold">You</span> connected{' '}
                          <Link to={`/profile/${connection.client.username}`} className="text-primary font-semibold hover:underline">
                            @{connection.client.username}
                          </Link>{' '}
                          with{' '}
                          <Link to={`/profile/${connection.talent.username}`} className="text-primary font-semibold hover:underline">
                            @{connection.talent.username}
                          </Link>{' '}
                          for the project "{connection.project}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{connection.date}</span>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-success" />
                          <span className="font-bold text-success">${connection.commission}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Right: The Roster */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">The Roster</h2>
                <p className="text-sm text-muted-foreground">Talents you're connected with</p>
                <div className="space-y-3">
                  {roster.map((talent) => (
                    <Card key={talent.id} className="shadow-soft hover:shadow-elevated transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={talent.avatar} />
                            <AvatarFallback>{talent.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{talent.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{talent.headline}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* CLIENT VIEW */}
          <TabsContent value="client" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Past Projects</h2>
            {clientProjects.map((project) => (
              <Card key={project.id} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{project.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>Completed: {project.completedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={project.talent.avatar} />
                          <AvatarFallback>T</AvatarFallback>
                        </Avatar>
                        <span>Hired:</span>
                        <Link to={`/profile/${project.talent.username}`} className="text-primary font-semibold hover:underline">
                          @{project.talent.username}
                        </Link>
                      </div>
                      {project.scout && (
                        <>
                          <span className="text-muted-foreground">via</span>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={project.scout.avatar} />
                              <AvatarFallback>S</AvatarFallback>
                            </Avatar>
                            <Link to={`/profile/${project.scout.username}`} className="text-primary font-semibold hover:underline">
                              @{project.scout.username}
                            </Link>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-2">Your Review:</p>
                      <p className="text-muted-foreground italic">"{project.review}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockContracts, getUserById } from "@/lib/mockData";
import { DollarSign, Link2, FileText } from "lucide-react";

export default function Workspace() {
  const [activeTab, setActiveTab] = useState("contracts");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div>
          <h1 className="text-4xl font-black mb-2">Workspace</h1>
          <p className="text-muted-foreground mb-8">
            Manage your projects and conversations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* Contracts View */}
          <TabsContent value="contracts" className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Badge variant="default" className="cursor-pointer">All</Badge>
              <Badge variant="outline" className="cursor-pointer">Active</Badge>
              <Badge variant="outline" className="cursor-pointer">Pending Funding</Badge>
              <Badge variant="outline" className="cursor-pointer">Completed</Badge>
            </div>

            {/* Contract Cards */}
            <div className="space-y-4">
              {mockContracts.map((contract) => {
                const client = getUserById(contract.client_id);
                const talent = getUserById(contract.talent_id);
                const scout = contract.scout_id ? getUserById(contract.scout_id) : null;
                
                const statusColors = {
                  active: "bg-primary",
                  pending_funding: "bg-action",
                  in_dispute: "bg-destructive",
                  completed: "bg-success",
                };

                return (
                  <Card key={contract.id} className="shadow-soft hover:shadow-elevated transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-primary">
                              {contract.project_title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Client: @{client?.username || 'unknown'}</span>
                              <span>•</span>
                              <span>Talent: @{talent?.username || 'unknown'}</span>
                            </div>
                          </div>
                          
                          <Badge className={statusColors[contract.status]}>
                            {contract.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        {/* Financial Info */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-success" />
                            <span className="text-muted-foreground">Funds in Escrow:</span>
                            <span className="font-bold text-success">
                              ${contract.escrow_amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Total Value:</span>
                            <span className="font-bold">
                              ${contract.total_value.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Scout Acknowledgment */}
                        {scout && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link2 className="h-4 w-4" />
                            <span>Connected by @{scout.username}</span>
                          </div>
                        )}

                        {/* Milestones Preview */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Milestones Progress</p>
                          <div className="flex gap-2">
                            {contract.milestones.map((milestone) => (
                              <div
                                key={milestone.id}
                                className={`h-2 flex-1 rounded-full ${
                                  milestone.status === 'approved'
                                    ? 'bg-success'
                                    : milestone.status === 'submitted'
                                    ? 'bg-action'
                                    : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {contract.milestones.filter(m => m.status === 'approved').length} of{' '}
                            {contract.milestones.length} milestones completed
                          </p>
                        </div>

                        {/* Action */}
                        <Button variant="outline" className="w-full">
                          View Contract Details →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Messages View */}
          <TabsContent value="messages">
            <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <Card className="lg:col-span-1 shadow-soft overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          i === 1 ? 'bg-muted/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                              alt="Avatar"
                              className="h-12 w-12 rounded-full"
                            />
                            {i <= 2 && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-action rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">@user_name_{i}</p>
                              <span className="text-xs text-muted-foreground">2h</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              Hey, I'd love to discuss the project...
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active Chat */}
              <Card className="lg:col-span-2 shadow-soft flex flex-col">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=1"
                      alt="Avatar"
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">@user_name_1</p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                </div>
                
                <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Start of conversation with @user_name_1
                    </p>
                  </div>
                  
                  {/* Sample messages */}
                  <div className="flex gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=1"
                      alt="Avatar"
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="bg-muted rounded-lg p-3 max-w-md">
                        <p className="text-sm">
                          Hey! I saw your profile and I think you'd be perfect for a project I'm working on.
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">2:34 PM</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 flex-row-reverse">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=jesuel"
                      alt="Avatar"
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="flex-1 flex flex-col items-end space-y-1">
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-md">
                        <p className="text-sm">
                          Thanks for reaching out! I'd love to hear more about it.
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">2:36 PM</span>
                    </div>
                  </div>
                </CardContent>
                
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button className="bg-primary">Send</Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Link2, Circle } from "lucide-react";
import { mockTalents, mockServices } from "@/lib/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Discover() {
  const [sortBy, setSortBy] = useState("recommended");
  const [availableOnly, setAvailableOnly] = useState(false);

  const filteredTalents = availableOnly
    ? mockTalents.filter(t => t.talent_availability)
    : mockTalents;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="sticky top-20 shadow-soft">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold mb-4">Filters</h3>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input placeholder="Search talents..." />
                </div>

                <Separator />

                {/* Skills */}
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <Input placeholder="e.g., React, Design..." />
                  <p className="text-xs text-muted-foreground">Press enter to add</p>
                </div>

                <Separator />

                {/* Budget Range */}
                <div className="space-y-3">
                  <Label>Budget Range</Label>
                  <Slider defaultValue={[1000, 5000]} max={10000} step={100} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$1,000</span>
                    <span>$5,000</span>
                  </div>
                </div>

                <Separator />

                {/* Finder's Fee */}
                <div className="space-y-3">
                  <Label className="text-success">Finder's Fee %</Label>
                  <Slider
                    defaultValue={[10]}
                    max={20}
                    step={1}
                    className="[&_[role=slider]]:bg-success"
                  />
                  <p className="text-sm text-muted-foreground">Min: 10%</p>
                </div>

                <Separator />

                {/* Special Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="available">Available Only</Label>
                    <Switch
                      id="available"
                      checked={availableOnly}
                      onCheckedChange={setAvailableOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Talent Grid */}
          <main className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black mb-2">Discovery Hub</h1>
                <p className="text-muted-foreground">
                  {filteredTalents.length} talented professionals ready to work
                </p>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="connections">Most Connections</SelectItem>
                  <SelectItem value="reputation">Highest Reputation</SelectItem>
                  <SelectItem value="finder_fee">Highest Finder's Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Talent Cards Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTalents.map((talent, index) => {
                const service = mockServices[index % mockServices.length];
                
                return (
                  <Card
                    key={talent.id}
                    className="overflow-hidden shadow-soft hover:shadow-elevated transition-shadow group"
                  >
                    {/* Top Section - Profile */}
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-success">
                          <AvatarImage src={talent.avatar} />
                          <AvatarFallback>{talent.full_name[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-primary truncate">
                            {talent.full_name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {talent.headline}
                          </p>
                          {talent.talent_availability && (
                            <div className="flex items-center gap-1 mt-1 text-success text-sm font-medium">
                              <Circle className="h-2 w-2 fill-current" />
                              Available Now
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Finder's Fee Tag */}
                      <div className="flex items-center justify-between">
                        <Badge className="bg-success text-success-foreground">
                          Finder's Fee: {service?.finder_fee || 12}%
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>⭐</span>
                          <span>{talent.reputation}%</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Link2 className="h-4 w-4" />
                          Connect
                        </Button>
                        <Button size="sm" className="bg-action hover:bg-action/90 gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Inquiry
                        </Button>
                      </div>
                    </CardContent>

                    {/* Bottom Section - Mini Gallery */}
                    <div className="grid grid-cols-3 gap-1 bg-muted/30 p-2">
                      {service?.images.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className="aspect-square rounded overflow-hidden bg-muted"
                        >
                          <img
                            src={img}
                            alt={`Work ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Load More */}
            <div className="flex justify-center pt-8">
              <Button variant="outline" size="lg">
                Load More Talents
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

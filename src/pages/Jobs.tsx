import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, TrendingUp, ArrowRight } from "lucide-react";
import { mockJobs, getUserById } from "@/lib/mockData";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Jobs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">Job Board</h1>
            <p className="text-muted-foreground">
              {mockJobs.length} active opportunities waiting for you
            </p>
          </div>
          
          <Button className="bg-action hover:bg-action/90 gap-2">
            + Post a Project
          </Button>
        </div>

        {/* Sorting */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Badge variant="secondary">All Projects</Badge>
            <Badge variant="outline">My Applications</Badge>
            <Badge variant="outline">Recommended</Badge>
          </div>
          
          <Select defaultValue="recent">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="budget-high">Budget (High to Low)</SelectItem>
              <SelectItem value="activity">Most Activity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {mockJobs.map((job) => (
            <Card key={job.id} className="shadow-soft hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h2 className="text-2xl font-bold text-primary hover:underline cursor-pointer">
                        {job.title}
                      </h2>
                      
                      {/* Client Info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${job.client_id}`} />
                          <AvatarFallback>C</AvatarFallback>
                        </Avatar>
                        <span>Posted by @client_{job.client_id.slice(-2)}</span>
                        <span>⭐ 97%</span>
                      </div>
                    </div>
                    
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>

                  {/* Key Data Pills */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      💰 ${job.budget_min.toLocaleString()}-${job.budget_max.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      ⏱️ {job.duration}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      🎯 {job.level}
                    </Badge>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    {/* Social Proof */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job.applications_count} Applications
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {job.recommendations_count} Recommendations
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Recommend
                      </Button>
                      <Button size="sm" className="bg-action hover:bg-action/90 gap-2">
                        Apply (2 Credits)
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/jobs/${job.id}`}>
                          View Details <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State Example (commented out) */}
        {/* <Card className="shadow-soft p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-xl font-bold">No talent found matching all your filters</h3>
            <p className="text-muted-foreground">
              Try removing your last filter to broaden your search.
            </p>
            <Button className="bg-action hover:bg-action/90">
              Post a project on the Job Board
            </Button>
          </div>
        </Card> */}
      </div>
    </div>
  );
}

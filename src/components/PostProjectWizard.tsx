import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';

interface PostProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

interface ProjectData {
  title: string;
  skills: string[];
  description: string;
  budgetMin: number;
  budgetMax: number;
  duration: string;
  experienceLevel: string;
}

const SKILL_SUGGESTIONS = [
  'UI/UX Design', 'Figma', 'Web Development', 'React', 'Smart Contracts',
  'Clarity', 'Blockchain', 'Motion Graphics', 'Video Editing', 'Branding',
  'Logo Design', 'Copywriting', 'SEO', 'Marketing', 'Social Media'
];

const DURATION_OPTIONS = [
  'Less than 1 week',
  '1-2 weeks',
  '2-4 weeks',
  '1-2 months',
  '2-3 months',
  '3-6 months',
  'More than 6 months'
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', description: 'New to the field' },
  { value: 'intermediate', label: 'Intermediate', description: '2-5 years experience' },
  { value: 'expert', label: 'Expert', description: '5+ years experience' }
];

export const PostProjectWizard = ({ open, onClose, onSuccess }: PostProjectWizardProps) => {
  const { stacksAddress } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    skills: [],
    description: '',
    budgetMin: 0,
    budgetMax: 0,
    duration: '',
    experienceLevel: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleSkillInput = (value: string) => {
    setSkillInput(value);
    if (value.length > 0) {
      const filtered = SKILL_SUGGESTIONS.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !projectData.skills.includes(skill)
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  };

  const addSkill = (skill: string) => {
    if (!projectData.skills.includes(skill)) {
      setProjectData({ ...projectData, skills: [...projectData.skills, skill] });
      setSkillInput('');
      setFilteredSkills([]);
    }
  };

  const removeSkill = (skill: string) => {
    setProjectData({
      ...projectData,
      skills: projectData.skills.filter(s => s !== skill)
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return projectData.title.trim().length > 0;
      case 2:
        return projectData.skills.length > 0;
      case 3:
        return projectData.description.trim().length > 50;
      case 4:
        return projectData.budgetMin > 0 && projectData.budgetMax >= projectData.budgetMin && projectData.duration !== '';
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePublish = async () => {
    if (!stacksAddress) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to post a project'
      });
      return;
    }

    setIsPublishing(true);
    
    try {
      console.log('[POST PROJECT] Publishing project:', projectData);
      
      // Call the create-project Edge Function
      const response = await fetch(
        'https://odewvxxcqqqfpanvsaij.supabase.co/functions/v1/create-project',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            clientId: stacksAddress,
            title: projectData.title,
            description: projectData.description,
            budgetMin: projectData.budgetMin,
            budgetMax: projectData.budgetMax,
            budgetType: 'fixed',
            duration: projectData.duration,
            experienceLevel: projectData.experienceLevel,
            skills: projectData.skills,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      console.log('[POST PROJECT] Success:', result.project);
      
      toast.success('Project posted successfully!', {
        description: 'Your project is now live on the Job Board'
      });
      
      onSuccess?.(result.project.id);
      onClose();
      
      // Navigate to the job board
      navigate('/jobs');
      
      // Reset form
      setStep(1);
      setProjectData({
        title: '',
        skills: [],
        description: '',
        budgetMin: 0,
        budgetMax: 0,
        duration: '',
        experienceLevel: ''
      });
    } catch (error) {
      console.error('[POST PROJECT] Error:', error);
      toast.error('Failed to post project', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Give your project a title</h2>
              <p className="text-muted-foreground">
                Make it clear and specific so the right talent can find you
              </p>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="e.g., Need a logo for my new coffee brand"
                value={projectData.title}
                onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                className="text-lg h-14"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                {projectData.title.length} characters
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">What skills are needed?</h2>
              <p className="text-muted-foreground">
                Add skills to help talent understand what you're looking for
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Start typing a skill..."
                  value={skillInput}
                  onChange={(e) => handleSkillInput(e.target.value)}
                  className="text-lg h-14"
                  autoFocus
                />
                
                {filteredSkills.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {projectData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {projectData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm px-3 py-1">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="pt-4">
                <p className="text-sm font-semibold mb-2">Popular skills:</p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_SUGGESTIONS.slice(0, 8).filter(s => !projectData.skills.includes(s)).map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => addSkill(skill)}
                    >
                      + {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Describe your project</h2>
              <p className="text-muted-foreground">
                The more details you provide, the better proposals you'll receive
              </p>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Tell us about your project...&#10;&#10;What's the main goal?&#10;Who's your target audience?&#10;Any examples or references you like?"
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                className="min-h-[300px] text-base"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                {projectData.description.length} characters (minimum 50)
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Define the scope</h2>
              <p className="text-muted-foreground">
                Help talent understand the project size and timeline
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Budget */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Budget Range (STX)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Minimum</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      placeholder="500"
                      value={projectData.budgetMin || ''}
                      onChange={(e) => setProjectData({ ...projectData, budgetMin: parseFloat(e.target.value) || 0 })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Maximum</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      placeholder="1000"
                      value={projectData.budgetMax || ''}
                      onChange={(e) => setProjectData({ ...projectData, budgetMax: parseFloat(e.target.value) || 0 })}
                      className="h-12"
                    />
                  </div>
                </div>
              </div>
              
              {/* Duration */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Estimated Duration</Label>
                <div className="grid grid-cols-2 gap-3">
                  {DURATION_OPTIONS.map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setProjectData({ ...projectData, duration })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        projectData.duration === duration
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Experience Level */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold">Experience Level Required</Label>
                <div className="space-y-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setProjectData({ ...projectData, experienceLevel: level.value })}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        projectData.experienceLevel === level.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-semibold">{level.label}</div>
                      <div className="text-sm text-muted-foreground">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Review & Publish</h2>
              <p className="text-muted-foreground">
                Here's how your project will appear on the Job Board
              </p>
            </div>
            
            <div className="border-2 rounded-lg p-6 space-y-4 bg-muted/30">
              <div>
                <h3 className="text-2xl font-bold mb-2">{projectData.title}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {projectData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {projectData.description}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-semibold">{projectData.budgetMin} - {projectData.budgetMax} STX</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{projectData.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="font-semibold capitalize">{projectData.experienceLevel}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 What happens next?</strong><br />
                Your project will be published to the Job Board where talent can apply and scouts can recommend candidates. This is FREE - you only pay when you hire someone.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        {/* Progress Bar */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t bg-muted/30 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="w-32"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="w-32 bg-action hover:bg-action/90"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-40 bg-success hover:bg-success/90"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Publish Project
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

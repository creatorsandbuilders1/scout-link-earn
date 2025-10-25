import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, DollarSign, Image as ImageIcon, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  type: 'portfolio' | 'gig';
  title: string;
  description: string | null;
  image_urls: string[];
  price: number | null;
  status: string;
}

interface PostFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  talentId: string;
  post?: Post | null; // If provided, edit mode
}

export function PostFormModal({ open, onClose, onSuccess, talentId, post }: PostFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [type, setType] = useState<'portfolio' | 'gig'>('portfolio');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const isEditMode = !!post;

  // Initialize form with post data if editing
  useEffect(() => {
    if (post) {
      setType(post.type);
      setTitle(post.title);
      setDescription(post.description || '');
      setPrice(post.price?.toString() || '');
      setImageUrls(post.image_urls || []);
    } else {
      // Reset form for new post
      setType('portfolio');
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrls([]);
      setSelectedFiles([]);
      setImageUrlInput('');
    }
  }, [post, open]);

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImageUrls([...imageUrls, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      // Step 1: Get authenticated JWT for storage operations
      console.log('[POST_FORM] Fetching auth JWT for storage...');
      const jwtResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-auth-jwt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            stacksAddress: talentId,
          }),
        }
      );

      const jwtResult = await jwtResponse.json();

      if (!jwtResponse.ok || !jwtResult.success) {
        throw new Error(jwtResult.error || 'Failed to get authentication token');
      }

      console.log('[POST_FORM] Auth JWT obtained');

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

      console.log('[POST_FORM] Temporary authenticated client created');

      // Step 3: Upload each file
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${talentId}/post-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await tempSupabaseClient.storage
          .from('posts-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('[POST_FORM] Upload error for', file.name, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = tempSupabaseClient.storage
          .from('posts-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
        console.log('[POST_FORM] Uploaded:', file.name, '→', publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('[POST_FORM] Image upload error:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (type === 'gig' && (!price || parseFloat(price) <= 0)) {
      toast.error('Gigs must have a price greater than 0');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Upload any selected files first
      let uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        toast.info('Uploading images...', {
          description: `Uploading ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}`,
        });

        try {
          uploadedImageUrls = await uploadImages();
          console.log('[POST_FORM] All images uploaded:', uploadedImageUrls);
        } catch (error) {
          toast.error('Failed to upload images', {
            description: error instanceof Error ? error.message : 'Please try again',
          });
          setLoading(false);
          return;
        }
      }

      // Step 2: Combine uploaded URLs with manually added URLs
      const allImageUrls = [...imageUrls, ...uploadedImageUrls];

      // Step 3: Save post with all image URLs
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upsert-post`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            postId: post?.id,
            talentId,
            type,
            title: title.trim(),
            description: description.trim() || null,
            imageUrls: allImageUrls,
            price: type === 'gig' ? parseFloat(price) : null,
            status: 'published',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error('Failed to save post', {
          description: result.error || 'Please try again',
        });
        return;
      }

      toast.success(isEditMode ? 'Post updated!' : 'Post created!', {
        description: isEditMode 
          ? 'Your post has been updated successfully'
          : 'Your new post is now live in your gallery',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('[POST_FORM] Error:', error);
      toast.error('Failed to save post', {
        description: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Post' : 'Add to Gallery'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection (only for new posts) */}
          {!isEditMode && (
            <div className="space-y-3">
              <Label>What would you like to add?</Label>
              <RadioGroup value={type} onValueChange={(value) => setType(value as 'portfolio' | 'gig')}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="portfolio" id="portfolio" />
                  <Label htmlFor="portfolio" className="cursor-pointer flex-1">
                    <div>
                      <p className="font-semibold">Portfolio Post</p>
                      <p className="text-sm text-muted-foreground">
                        Showcase your work (no price required)
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="gig" id="gig" />
                  <Label htmlFor="gig" className="cursor-pointer flex-1">
                    <div>
                      <p className="font-semibold">Gig (Transactable Service)</p>
                      <p className="text-sm text-muted-foreground">
                        A service clients can purchase directly
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'gig' ? 'e.g., Brand Identity Package' : 'e.g., Mobile App Design'}
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your work or service..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Price (only for gigs) */}
          {type === 'gig' && (
            <div className="space-y-2">
              <Label htmlFor="price">Price (STX) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required={type === 'gig'}
                  min="0"
                  step="0.01"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Your universal Finder's Fee will apply to this gig
              </p>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Images</Label>
            
            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploadingImages || loading}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload images</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB each
                </p>
              </label>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files ({selectedFiles.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual URL Input */}
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Or add image URLs manually</p>
              <div className="flex gap-2">
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste image URL..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
            
            {/* Added URLs */}
            {imageUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Added URLs ({imageUrls.length})</p>
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImageUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 bg-action hover:bg-action/90"
            >
              {loading || uploadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImages ? 'Uploading images...' : 'Saving...'}
                </>
              ) : (
                isEditMode ? 'Update Post' : 'Create Post'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

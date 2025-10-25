import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScoutTrackingProvider } from "./contexts/ScoutTrackingContext";
import Landing from "./pages/Landing";
import Feed from "./pages/Feed";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Workspace from "./pages/Workspace";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import ContractDetail from "./pages/ContractDetail";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

console.log('[APP] App.tsx loaded');

/**
 * =====================================================
 * APP COMPONENT - CLEAN ROUTING ARCHITECTURE
 * =====================================================
 * 
 * This component ONLY handles routing.
 * Layout control is delegated to individual page components.
 * 
 * Each page opts into its layout via composition:
 * - Landing uses LandingLayout
 * - Protected pages use AppLayout
 * 
 * This creates a true multi-page architecture where:
 * - Direct links work correctly
 * - F5 refresh maintains state
 * - Pages are independent and scalable
 * =====================================================
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScoutTrackingProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            
            {/* Protected Routes - Each page controls its own layout */}
            <Route 
              path="/feed" 
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/discover" 
              element={
                <ProtectedRoute>
                  <Discover />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jobs" 
              element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jobs/:id" 
              element={
                <ProtectedRoute>
                  <JobDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/workspace" 
              element={
                <ProtectedRoute>
                  <Workspace />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/workspace/:projectId" 
              element={
                <ProtectedRoute>
                  <ContractDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/wallet" 
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile/:username" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/post/:postId" 
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/contracts/:id" 
              element={
                <ProtectedRoute>
                  <ContractDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect old edit profile route to settings */}
            <Route 
              path="/settings/profile" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ScoutTrackingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

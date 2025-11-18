import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Wallet, Zap, TrendingUp, Shield, Users, CheckCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { LandingLayout } from "@/components/layout/LandingLayout";
import { toast } from "sonner";

// Real avatar URLs from Supabase storage
const REAL_AVATARS = [
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-24%20112117.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-24%20112141.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-24%20171206.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-24%20172123.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20133414.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20140555.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20143118.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20144149.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20153454.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20153526.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20153540.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20153622.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20153642.png',
  'https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/faceee.png',
];

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectWallet, isConnected } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the return URL from location state (set by ProtectedRoute)
  const from = location.state?.from?.pathname || '/feed';

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Redirect if already connected - go to return URL or feed
  useEffect(() => {
    if (isConnected && window.location.pathname === '/') {
      console.log('[LANDING] User connected, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isConnected, navigate, from]);

  /**
   * Direct wallet connection - Opens Stacks native modal
   * No intermediate modal needed
   */
  const handleConnect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      console.log('[LANDING] Opening Stacks wallet selector...');
      await connectWallet();
      toast.success('Wallet connected successfully!');
      // Redirect to return URL or feed
      navigate(from, { replace: true });
    } catch (error) {
      console.error('[LANDING] Failed to connect wallet:', error);
      toast.error('Failed to connect wallet', {
        description: 'Please make sure you have Xverse or Leather installed.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Fixed Connect Wallet Button - Opens Stacks Modal Directly */}
      <div className="fixed top-6 right-6 z-50">
        <Button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-action hover:bg-action/90 text-white font-black px-8 py-4 rounded-full shadow-float text-lg border-4 border-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="mr-2 h-6 w-6" />
          {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
        </Button>
      </div>

      {/* Section 1: Above the Fold - The Manifesto */}
      <section 
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #1e40af 50%, #2563EB 100%)',
        }}
      >
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orbs with Better Animation */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float-enhanced"
              style={{
                width: `${150 + i * 30}px`,
                height: `${150 + i * 30}px`,
                left: `${(i * 15) % 100}%`,
                top: `${(i * 20) % 100}%`,
                background: `radial-gradient(circle, ${
                  i % 3 === 0 ? 'rgba(249, 115, 22, 0.15)' : 
                  i % 3 === 1 ? 'rgba(74, 222, 128, 0.15)' : 
                  'rgba(96, 165, 250, 0.15)'
                } 0%, transparent 70%)`,
                filter: 'blur(20px)',
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${20 + i * 2}s`,
              }}
            />
          ))}
          
          {/* Geometric Shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 border-4 border-success/20 rounded-full animate-pulse" />
          <div className="absolute bottom-32 right-32 w-24 h-24 bg-action/10 rotate-45 animate-spin-slow" />
          <div className="absolute top-1/2 left-10 w-16 h-16 border-4 border-primary/20 animate-bounce" />
          
          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
            <path 
              d="M 100 200 Q 300 100, 500 300 T 900 200" 
              stroke="url(#lineGradient)" 
              strokeWidth="3" 
              fill="none" 
              strokeDasharray="20,10"
              className="animate-pulse"
            />
            <path 
              d="M 200 400 Q 400 300, 600 500 T 800 400" 
              stroke="url(#lineGradient)" 
              strokeWidth="2" 
              fill="none" 
              strokeDasharray="15,8"
              className="animate-pulse"
              style={{ animationDelay: '1s' }}
            />
          </svg>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-4 max-w-7xl mx-auto pt-20 sm:pt-24">
          {/* Logo - Properly Sized */}
          <div className="mb-6 relative">
            <img 
              src="https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/logoreferydo.png" 
              alt="REFERYDO!" 
              className="w-full max-w-4xl mx-auto"
              style={{
                filter: 'drop-shadow(0 0 60px rgba(249, 115, 22, 0.4))',
              }}
            />
            
            {/* Subtle Decorative Elements */}
            <div className="absolute -top-6 left-1/4 w-20 h-20 border-4 border-success/30 rounded-full animate-spin-slow" />
            <div className="absolute -bottom-6 right-1/4 w-16 h-16 bg-action/20 rounded-full animate-bounce" />
          </div>

          {/* Slogan */}
          <h2 
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-8 tracking-[0.3em] text-white/90"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            R E F E R - Y O U - D O
          </h2>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white max-w-4xl mx-auto mb-12 leading-relaxed">
            The decentralized talent economy,<br />
            <span className="text-success">powered by people you trust.</span>
          </p>

          {/* Enhanced People Network Visualization - Dispersed Floating Bubbles */}
          <div className="relative h-64 sm:h-72 md:h-80 mb-8">
            {/* Main Talent Avatar */}
            <div className="absolute left-[15%] sm:left-1/4 top-0 animate-float-enhanced" style={{ animationDelay: '0s' }}>
              <div className="relative">
                <img
                  src={REAL_AVATARS[0]}
                  alt="Talent"
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-float object-cover"
                />
                <div className="absolute -inset-2 rounded-full border-2 border-success/30 animate-ping" />
                <div className="absolute -bottom-2 -right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-full">
                  TALENT
                </div>
              </div>
            </div>

            {/* Main Scout Avatar */}
            <div className="absolute right-[15%] sm:right-1/4 top-4 sm:top-8 animate-float-enhanced" style={{ animationDelay: '1s' }}>
              <div className="relative">
                <img
                  src={REAL_AVATARS[1]}
                  alt="Scout"
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-action shadow-float object-cover"
                />
                <div className="absolute -inset-2 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                  SCOUT
                </div>
              </div>
            </div>

            {/* Main Client Avatar */}
            <div className="absolute left-1/2 -translate-x-1/2 top-8 sm:top-12 md:top-16 animate-float-enhanced" style={{ animationDelay: '0.5s' }}>
              <div className="relative">
                <img
                  src={REAL_AVATARS[2]}
                  alt="Client"
                  className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-success shadow-float object-cover"
                />
                <div className="absolute -inset-3 rounded-full border-2 border-action/30 animate-ping" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-2 -right-2 bg-action text-white text-xs font-bold px-2 py-1 rounded-full">
                  CLIENT
                </div>
              </div>
            </div>

            {/* Floating Avatars - Dispersed as Independent Bubbles */}
            {/* Top Left Corner */}
            <div className="absolute left-[5%] top-[10%] animate-float-enhanced" style={{ animationDelay: '2s' }}>
              <img
                src={REAL_AVATARS[3]}
                alt="User"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-white shadow-float object-cover opacity-95"
              />
            </div>

            {/* Top Right Corner */}
            <div className="absolute right-[8%] top-[5%] animate-float-enhanced" style={{ animationDelay: '2.5s' }}>
              <img
                src={REAL_AVATARS[4]}
                alt="User"
                className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border-3 border-white shadow-float object-cover opacity-90"
              />
            </div>

            {/* Left Side Middle */}
            <div className="absolute left-[8%] top-[45%] animate-float-enhanced" style={{ animationDelay: '1.5s' }}>
              <img
                src={REAL_AVATARS[5]}
                alt="User"
                className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-3 border-white shadow-float object-cover opacity-95"
              />
            </div>

            {/* Right Side Middle */}
            <div className="absolute right-[5%] top-[50%] animate-float-enhanced" style={{ animationDelay: '3s' }}>
              <img
                src={REAL_AVATARS[6]}
                alt="User"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-white shadow-float object-cover opacity-90"
              />
            </div>

            {/* Bottom Left */}
            <div className="absolute left-[12%] bottom-[5%] animate-float-enhanced" style={{ animationDelay: '2.2s' }}>
              <img
                src={REAL_AVATARS[7]}
                alt="User"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-float object-cover opacity-85"
              />
            </div>

            {/* Bottom Right */}
            <div className="absolute right-[10%] bottom-[8%] animate-float-enhanced" style={{ animationDelay: '2.8s' }}>
              <img
                src={REAL_AVATARS[8]}
                alt="User"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-3 border-white shadow-float object-cover opacity-90"
              />
            </div>

            {/* Center Top */}
            <div className="absolute left-[45%] top-[2%] animate-float-enhanced" style={{ animationDelay: '1.8s' }}>
              <img
                src={REAL_AVATARS[9]}
                alt="User"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-float object-cover opacity-80"
              />
            </div>

            {/* Far Left */}
            <div className="absolute left-[2%] top-[30%] animate-float-enhanced" style={{ animationDelay: '3.2s' }}>
              <img
                src={REAL_AVATARS[10]}
                alt="User"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-float object-cover opacity-85"
              />
            </div>

            {/* Far Right */}
            <div className="absolute right-[3%] top-[35%] animate-float-enhanced" style={{ animationDelay: '2.6s' }}>
              <img
                src={REAL_AVATARS[11]}
                alt="User"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-white shadow-float object-cover opacity-85"
              />
            </div>

            {/* Bottom Center */}
            <div className="absolute left-[48%] bottom-[3%] animate-float-enhanced" style={{ animationDelay: '3.5s' }}>
              <img
                src={REAL_AVATARS[12]}
                alt="User"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-float object-cover opacity-80"
              />
            </div>

            {/* Extra Top Left */}
            <div className="absolute left-[18%] top-[8%] animate-float-enhanced" style={{ animationDelay: '2.4s' }}>
              <img
                src={REAL_AVATARS[13]}
                alt="User"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-float object-cover opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 sm:bottom-12 left-1/2 transform -translate-x-1/2 text-center z-20">
          <p className="text-base sm:text-lg md:text-xl font-black text-white mb-3 sm:mb-4 tracking-widest animate-pulse">
            SCROLL TO UNLEASH
          </p>
          <ArrowDown className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-bounce mx-auto" />
        </div>
      </section>

      {/* Section 2: The Ecosystem - Vertical Scroll */}
      <section className="bg-gradient-to-br from-success/10 to-primary/10 py-20">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 
              className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-8 transition-all duration-1000 ${
                scrollY > 400 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <span className="text-success">Three Roles.<br />
              One Fair</span><br />
              <span className="text-primary">Ecosystem.</span>
            </h2>
          </div>

          {/* Roles Grid */}
          <div className="space-y-32">
            {/* Role 1: FOR TALENT */}
            <div 
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center transition-all duration-1000 ${
                scrollY > 600 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
              }`}
            >
              <div className="relative">
                {/* Decorative Circle */}
                <div className="absolute -top-10 -right-10 w-32 h-32 lg:w-48 lg:h-48 border-8 border-success/20 rounded-full animate-spin-slow" />
                
                {/* Image */}
                <div className="relative z-10">
                  <div className="w-64 h-64 lg:w-80 lg:h-80 mx-auto relative">
                    <img
                      src={REAL_AVATARS[0]}
                      alt="Talent"
                      className="w-full h-full rounded-full border-8 border-success shadow-float animate-float-enhanced object-cover"
                    />
                    <div className="absolute -bottom-4 -right-4 bg-success text-white px-6 py-3 rounded-full font-black text-xl">
                      TALENT
                    </div>
                    <div className="absolute -inset-4 rounded-full border-4 border-success/30 animate-ping" />
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-left">
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-success">
                  Build Your Brand.
                </h3>
                <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed mb-8">
                  Create your dynamic profile, set your own referral fees, and let an army of motivated Scouts bring you clients.
                </p>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    <div className="w-4 h-4 bg-success rounded-full animate-pulse" />
                    <span className="text-lg font-semibold text-gray-800">Own Your Profile</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    <div className="w-4 h-4 bg-success rounded-full animate-pulse delay-100" />
                    <span className="text-lg font-semibold text-gray-800">Set Your Rates</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    <div className="w-4 h-4 bg-success rounded-full animate-pulse delay-200" />
                    <span className="text-lg font-semibold text-gray-800">Get Discovered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role 2: FOR SCOUTS */}
            <div 
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center transition-all duration-1000 ${
                scrollY > 1000 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
              }`}
            >
              <div className="order-2 lg:order-1 text-center lg:text-left">
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-primary">
                  Monetize Your Network.
                </h3>
                <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed mb-8">
                  Discover elite talent, make valuable connections, and earn instantly and automatically when they succeed. Your social capital is now a real asset.
                </p>

                {/* Network Visualization */}
                <div className="flex justify-center lg:justify-start items-center gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-sm font-bold">Find</span>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary animate-pulse" />
                  <div className="text-center">
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-2">
                      <span className="text-2xl">💰</span>
                    </div>
                    <span className="text-sm font-bold">Earn</span>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2 relative">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -left-10 w-24 h-24 lg:w-40 lg:h-40 bg-primary/10 rounded-full animate-pulse" />
                
                {/* Connection Visual */}
                <div className="relative z-10">
                  <div className="flex justify-center items-center gap-8">
                    <img
                      src={REAL_AVATARS[1]}
                      alt="Scout"
                      className="w-48 h-48 lg:w-64 lg:h-64 rounded-full border-8 border-primary shadow-float animate-float-enhanced object-cover"
                    />
                    <div className="flex flex-col gap-4">
                      <img
                        src={REAL_AVATARS[3]}
                        alt="Connection"
                        className="w-24 h-24 rounded-full border-4 border-primary/50 animate-float-enhanced object-cover"
                        style={{ animationDelay: '0.5s' }}
                      />
                      <img
                        src={REAL_AVATARS[4]}
                        alt="Connection"
                        className="w-24 h-24 rounded-full border-4 border-primary/50 animate-float-enhanced object-cover"
                        style={{ animationDelay: '1s' }}
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full font-black text-xl">
                    SCOUT
                  </div>
                </div>
              </div>
            </div>

            {/* Role 3: FOR CLIENTS */}
            <div 
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center transition-all duration-1000 ${
                scrollY > 1400 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
              }`}
            >
              <div className="relative">
                {/* Decorative Square */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 lg:w-48 lg:h-48 border-8 border-action/20 rotate-12 animate-spin-slow" />
                
                {/* Image */}
                <div className="relative z-10">
                  <div className="w-64 h-64 lg:w-80 lg:h-80 mx-auto relative">
                    <img
                      src={REAL_AVATARS[2]}
                      alt="Client"
                      className="w-full h-full rounded-full border-8 border-action shadow-float animate-float-enhanced object-cover"
                    />
                    <CheckCircle className="absolute -top-4 -right-4 w-20 h-20 text-action bg-white rounded-full p-2" />
                    <div className="absolute -bottom-4 -left-4 bg-action text-white px-6 py-3 rounded-full font-black text-xl">
                      CLIENT
                    </div>
                    <div className="absolute -inset-4 rounded-full border-4 border-action/30 animate-ping" />
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-left">
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-action">
                  Hire with Confidence.
                </h3>
                <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed mb-8">
                  Access a curated world of professionals recommended by experts. Every project is secured by our transparent smart contract escrow from start to finish.
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <div className="bg-action/10 px-6 py-3 rounded-full font-bold text-gray-800 border-2 border-action/20">
                    ✓ Verified Talent
                  </div>
                  <div className="bg-action/10 px-6 py-3 rounded-full font-bold text-gray-800 border-2 border-action/20">
                    ✓ Secure Escrow
                  </div>
                  <div className="bg-action/10 px-6 py-3 rounded-full font-bold text-gray-800 border-2 border-action/20">
                    ✓ Trusted Network
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The Old Way - Us vs. Them */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white">
        <div className="container mx-auto px-4 relative z-10">
          {/* Main Headline */}
          <h2 
            className={`text-5xl sm:text-6xl md:text-8xl font-black text-center mb-20 transition-all duration-1000 ${
              scrollY > 1800 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="text-gray-900">THE OLD WAY:</span><br />
            <span className="text-gray-800">A CAGED ECONOMY</span>
          </h2>

          {/* Us vs. Them Comparison */}
          <div 
            className={`w-full max-w-7xl mx-auto transition-all duration-1500 ${
              scrollY > 2000 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
              
              {/* Left Column: THEIR SYSTEM */}
              <div className="space-y-8">
                <h3 className="text-4xl md:text-5xl font-black text-gray-600 text-center lg:text-left">
                  THEIR SYSTEM
                </h3>
                
                {/* Broken/Faded Problems */}
                <div className="space-y-6">
                  <div className="bg-gray-200 text-gray-500 p-4 md:p-6 opacity-60 transform -rotate-1">
                    <h4 className="text-xl md:text-2xl font-bold">PREDATORY 20% FEES</h4>
                    <p className="text-sm mt-2">Platform takes your hard-earned money</p>
                  </div>
                  
                  <div className="bg-gray-200 text-gray-500 p-4 md:p-6 opacity-60 transform rotate-1">
                    <h4 className="text-xl md:text-2xl font-bold">RENTED REPUTATION</h4>
                    <p className="text-sm mt-2">Your reviews belong to them</p>
                  </div>
                  
                  <div className="bg-gray-200 text-gray-500 p-4 md:p-6 opacity-60 transform -rotate-1">
                    <h4 className="text-xl md:text-2xl font-bold">WASTED CONNECTIONS</h4>
                    <p className="text-sm mt-2">No reward for referrals</p>
                  </div>
                  
                  <div className="bg-gray-200 text-gray-500 p-4 md:p-6 opacity-60 transform rotate-1">
                    <h4 className="text-xl md:text-2xl font-bold">PAYMENT UNCERTAINTY</h4>
                    <p className="text-sm mt-2">Delayed and disputed payments</p>
                  </div>
                </div>
              </div>

              {/* Right Column: OUR PROMISE */}
              <div className="space-y-8">
                <h3 className="text-4xl md:text-5xl font-black text-primary text-center lg:text-left">
                  OUR PROMISE
                </h3>
                
                {/* Our Solutions with Energy Lines */}
                <div className="space-y-6 relative">
                  {/* Energy Lines Background */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                    <defs>
                      <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#4ADE80" />
                      </linearGradient>
                    </defs>
                    {[...Array(4)].map((_, i) => (
                      <path
                        key={i}
                        d={`M -50 ${20 + i * 25}% Q 50% ${15 + i * 25}%, 120% ${25 + i * 25}%`}
                        stroke="url(#energyGradient)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="10,5"
                        className="animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </svg>
                  
                  {/* Solution Cards */}
                  <div className="bg-success/10 border-l-4 border-success p-4 md:p-6 relative z-10">
                    <h4 className="text-xl md:text-2xl font-black text-success">FAIR 7% ECOSYSTEM FEE</h4>
                    <p className="text-sm mt-2 text-gray-700">Transparent, community-driven pricing</p>
                  </div>
                  
                  <div className="bg-primary/10 border-l-4 border-primary p-4 md:p-6 relative z-10">
                    <h4 className="text-xl md:text-2xl font-black text-primary">SOVEREIGN ON-CHAIN REPUTATION</h4>
                    <p className="text-sm mt-2 text-gray-700">Your reputation, owned by you forever</p>
                  </div>
                  
                  <div className="bg-action/10 border-l-4 border-action p-4 md:p-6 relative z-10">
                    <h4 className="text-xl md:text-2xl font-black text-action">EVERY REFERRAL GETS PAID. GUARANTEED.</h4>
                    <p className="text-sm mt-2 text-gray-700">Turn your network into income</p>
                  </div>
                  
                  <div className="bg-success/10 border-l-4 border-success p-4 md:p-6 relative z-10">
                    <h4 className="text-xl md:text-2xl font-black text-success">INSTANT & AUTOMATIC PAYOUTS</h4>
                    <p className="text-sm mt-2 text-gray-700">Smart contracts ensure immediate payment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* The Final Punchline */}
            <div 
              className={`text-center mt-20 transition-all duration-1000 delay-500 ${
                scrollY > 2200 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <div className="inline-flex items-center gap-8 p-8 bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl border-2 border-primary/20">
                <span className="text-5xl md:text-7xl font-black text-primary">REFER</span>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-1 bg-action mb-2" />
                  <div className="w-8 h-8 bg-action rounded-full flex items-center justify-center">
                    <span className="text-white font-black">→</span>
                  </div>
                  <div className="w-16 h-1 bg-action mt-2" />
                </div>
                <span className="text-5xl md:text-7xl font-black text-success">DO</span>
              </div>
              <p className="text-xl text-gray-600 mt-6 font-semibold">
                The future of work is here. Join the revolution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The Guarantees - Glassmorphism Cards */}
      <section 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #1e40af 100%)',
        }}
      >
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Reduced Floating Particles - Less Aggressive */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-float"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3 + 0.1,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 15}s`,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Title */}
          <h2 className="text-6xl md:text-8xl font-black text-center text-white mb-20">
            Built for Trust.<br />
            <span className="text-success">Powered by Code.</span>
          </h2>

          {/* Glassmorphism Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Card 1 */}
            <div 
              className={`group cursor-pointer transition-all duration-500 ${
                hoveredCard === null || hoveredCard === 1 ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
              }`}
              onMouseEnter={() => setHoveredCard(1)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="glass-tile p-10 rounded-3xl backdrop-blur-xl border-2 border-white/30 hover:border-success/50 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="mb-8 relative">
                  <div className="w-24 h-24 mx-auto bg-success/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-12 h-12 text-success" strokeWidth={3} />
                  </div>
                  {/* Animated Rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-success/30 rounded-full animate-ping" />
                  </div>
                </div>

                <h4 className="text-3xl font-black mb-4 text-white">
                  Instant & Fair Payouts
                </h4>
                <p className="text-lg text-white/80 leading-relaxed">
                  Our smart contract escrow acts as a neutral judge. The moment work is approved, funds are distributed instantly to the Talent, the Scout, and the platform. No delays, no excuses.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              className={`group cursor-pointer transition-all duration-500 ${
                hoveredCard === null || hoveredCard === 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
              }`}
              onMouseEnter={() => setHoveredCard(2)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="glass-tile p-10 rounded-3xl backdrop-blur-xl border-2 border-white/30 hover:border-primary/50 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="mb-8 relative">
                  <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-12 h-12 text-white" strokeWidth={3} />
                  </div>
                  {/* Checkmarks */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>

                <h4 className="text-3xl font-black mb-4 text-white">
                  Sovereign Reputation
                </h4>
                <p className="text-lg text-white/80 leading-relaxed">
                  Your work history is your asset. Every completed project is verifiably recorded on-chain, creating a portable reputation that you own forever. No algorithm can take it away from you.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div 
              className={`group cursor-pointer transition-all duration-500 ${
                hoveredCard === null || hoveredCard === 3 ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
              }`}
              onMouseEnter={() => setHoveredCard(3)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="glass-tile p-10 rounded-3xl backdrop-blur-xl border-2 border-white/30 hover:border-action/50 transition-all duration-300 h-full">
                {/* Icon */}
                <div className="mb-8 relative">
                  <div className="w-24 h-24 mx-auto bg-action/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-12 h-12 text-action" strokeWidth={3} />
                  </div>
                  {/* Voting Avatars */}
                  <div className="flex justify-center gap-2 mt-4">
                    {[5, 6, 7].map((i) => (
                      <img
                        key={i}
                        src={REAL_AVATARS[i]}
                        alt={`Voter ${i}`}
                        className="w-10 h-10 rounded-full border-2 border-white/80 shadow-float object-cover animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>

                <h4 className="text-3xl font-black mb-4 text-white">
                  Community-Led Justice
                </h4>
                <p className="text-lg text-white/80 leading-relaxed">
                  Fairness is guaranteed. Disputes are resolved by a randomly selected jury of your peers from the REFERYDO! community, not a corporate support desk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Platform Gallery - See It In Action */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #2563EB 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 text-gray-900">
              See It In Action
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
              A glimpse into the platform that's revolutionizing how talent connects with opportunity
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Screenshot 1 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
              <div className="aspect-video relative">
                <img
                  src="https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20154048.png"
                  alt="Discovery Hub"
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <h3 className="text-white font-black text-xl mb-2">Discovery Hub</h3>
                    <p className="text-white/80 text-sm">Find elite talent curated by your network</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshot 2 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
              <div className="aspect-video relative">
                <img
                  src="https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20154103.png"
                  alt="Talent Profiles"
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <h3 className="text-white font-black text-xl mb-2">Talent Profiles</h3>
                    <p className="text-white/80 text-sm">Showcase your work with stunning portfolios</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshot 3 */}
            <div className="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
              <div className="aspect-video relative">
                <img
                  src="https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/Captura%20de%20pantalla%202025-10-25%20154144.png"
                  alt="Smart Contract Workspace"
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <h3 className="text-white font-black text-xl mb-2">Smart Workspace</h3>
                    <p className="text-white/80 text-sm">Manage projects with blockchain security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-2xl font-bold text-gray-800 mb-6">
              Ready to experience the future of work?
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
              <span className="text-lg text-gray-600 font-semibold">Join thousands already building their reputation</span>
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-200" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Final CTA */}
      <section className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Radial Gradient Pulses */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-action/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-success/10 rounded-full blur-3xl animate-pulse delay-500" />
          
          {/* Reduced Floating Shapes - Less Aggressive */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 15}s`,
              }}
            >
              {i % 2 === 0 ? (
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4 border-action/20 rounded-full" />
              ) : (
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-success/10 rotate-45" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center relative z-10 px-4">
          {/* Main Question - Responsive */}
          <h2 
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] font-black text-white mb-8 sm:mb-12 md:mb-16 leading-none"
            style={{
              textShadow: '0 0 80px rgba(249, 115, 22, 0.5)',
              letterSpacing: '-0.02em',
            }}
          >
            READY<br />TO DO?
          </h2>

          {/* CTA Button - Responsive */}
          <div className="relative inline-block">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-action blur-3xl opacity-50 animate-pulse" />
            
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="relative bg-action hover:bg-action/90 text-white font-black text-lg sm:text-xl md:text-2xl lg:text-3xl px-8 py-4 sm:px-12 sm:py-6 md:px-16 md:py-8 rounded-full shadow-float border-3 sm:border-4 border-white hover:scale-105 sm:hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: '0 0 40px rgba(249, 115, 22, 0.8), 0 0 80px rgba(249, 115, 22, 0.4)',
              }}
            >
              <Wallet className="mr-2 sm:mr-3 md:mr-4 h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
              {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </Button>
          </div>

          {/* Subtext */}
          <p className="text-white/60 text-base sm:text-lg md:text-xl mt-8 sm:mt-10 md:mt-12 font-medium tracking-wider">
            JOIN THE FUTURE OF WORK
          </p>

          {/* Decorative Elements - Responsive */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12 md:mt-16">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success rounded-full animate-pulse" />
              <span className="text-white/80 font-bold text-sm sm:text-base">DECENTRALIZED</span>
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse delay-200" />
              <span className="text-white/80 font-bold text-sm sm:text-base">TRANSPARENT</span>
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-action rounded-full animate-pulse delay-400" />
              <span className="text-white/80 font-bold text-sm sm:text-base">FAIR</span>
            </div>
          </div>
        </div>
      </section>
    </div>
    </LandingLayout>
  );
}
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { Link } from "react-router-dom";

export const LandingNavigation = () => {
  return (
    <header className="fixed top-0 z-40 w-full bg-transparent">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl font-black tracking-tight">
            <span className="text-primary">REFERYDO</span>
            <span className="text-success">!</span>
          </div>
        </Link>

        {/* Right: Connect Wallet - This will be handled by the fixed button in Landing.tsx */}
        <div className="opacity-0">
          <Button className="bg-action hover:bg-action/90 text-white font-bold px-6 py-3">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
};
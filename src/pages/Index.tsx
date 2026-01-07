import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Mic, Users, Zap, Clock, CheckCircle2 } from "lucide-react";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  const features = [
    {
      icon: Mic,
      title: "AI Voice Interviews",
      description: "Fast, natural voice conversations with candidates.",
    },
    {
      icon: Clock,
      title: "Save Hours of Time",
      description: "Automate initial screening while maintaining quality.",
    },
    {
      icon: Users,
      title: "Fair & Consistent",
      description: "Every candidate gets the same professional experience.",
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description: "Get AI-generated reports and ratings immediately.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="lg" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/90 hover:text-white transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="text-white/90 hover:text-white transition-colors font-medium">How It Works</a>
            <Button variant="outline" onClick={() => navigate("/auth")} className="font-semibold bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary">Sign In</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section with Purple Gradient */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-purple-400 z-0" />
        
        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L1440 120L1440 0C1440 0 1080 80 720 80C360 80 0 0 0 0L0 120Z" fill="hsl(var(--background))" />
          </svg>
        </div>

        <div className="container mx-auto max-w-6xl relative z-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-white">
                Interviews,
                <br />
                Hassle-Free
                <br />
                Hiring
              </h1>
              <p className="text-lg text-white/90 leading-relaxed max-w-md">
                Let our AI voice agent conduct candidate interviews while you focus on 
                finding the perfect match. Save time, reduce bias, and improve your hiring process.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button 
                    size="lg" 
                    onClick={() => navigate("/auth")}
                    className="relative overflow-hidden bg-purple-600 text-white px-8 py-6 text-base font-semibold rounded-full shadow-lg group"
                  >
                    <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    <span className="relative z-10 group-hover:text-purple-600 transition-colors duration-300">Get Started Free</span>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="relative overflow-hidden bg-transparent text-white border-white px-8 py-6 text-base font-semibold rounded-full group"
                  >
                    <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    <span className="relative z-10 group-hover:text-purple-600 transition-colors duration-300">Watch Demo</span>
                  </Button>
                </motion.div>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>3 Free Interviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>

            {/* Hero Visual - Dashboard Mockup */}
            <div className="relative animate-slide-up hidden lg:block" style={{ animationDelay: "0.2s" }}>
              <div className="relative bg-card rounded-2xl border border-border p-6 shadow-2xl">
                {/* Sidebar mockup */}
                <div className="flex gap-4">
                  <div className="w-48 bg-muted/50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Logo size="sm" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-primary/10 text-primary rounded px-2 py-1.5 text-xs font-medium">
                        <div className="w-4 h-4 rounded bg-primary/20" />
                        Dashboard
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground px-2 py-1.5 text-xs">
                        <div className="w-4 h-4 rounded bg-muted" />
                        All Interviews
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground px-2 py-1.5 text-xs">
                        <div className="w-4 h-4 rounded bg-muted" />
                        Hiring
                      </div>
                    </div>
                  </div>
                  
                  {/* Main content mockup */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-semibold">Interview Stats</div>
                        <div className="text-xs text-muted-foreground">Showing latest 6 charts</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">Dashboard</div>
                      </div>
                    </div>
                    
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex gap-1 h-12 items-end justify-center">
                          {[40, 60, 45, 80, 55, 70, 50, 65].map((h, i) => (
                            <div key={i} className="w-1.5 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-center">
                        <div className="text-2xl font-bold text-primary">71%</div>
                      </div>
                    </div>
                    
                    {/* Recent interviews */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium">Recently Visited Interviews</div>
                      <div className="grid grid-cols-3 gap-2">
                        {['AI Voice Interviews', 'Save Hours of Time', 'Instant Feedback'].map((title, i) => (
                          <div key={i} className="bg-muted/20 rounded p-2 text-[10px]">
                            <div className="font-medium truncate">{title}</div>
                            <div className="text-muted-foreground">Details...</div>
                            <div className="mt-1 flex gap-1">
                              <span className="bg-primary/20 text-primary px-1 rounded text-[8px]">Active</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose AIcruiter?</h2>
            <p className="text-muted-foreground">
              Transform your recruitment process with AI-powered interviews
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-slide-up text-center"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Three simple steps to revolutionize your hiring
            </p>
          </div>
          <div className="space-y-6">
            {[
              { step: "01", title: "Create Interview", desc: "Define the job role, requirements, and let AI generate tailored questions." },
              { step: "02", title: "Share Link", desc: "Send the interview link to candidates - no app downloads needed." },
              { step: "03", title: "Review Results", desc: "Get AI-powered ratings and feedback summaries for each candidate." },
            ].map((item, index) => (
              <div 
                key={item.step}
                className="flex gap-5 items-start animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-lg font-bold text-white">{item.step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-primary via-primary to-purple-400 rounded-3xl p-10 md:p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Hiring?
              </h2>
              <p className="text-white/80 text-base mb-8 max-w-xl mx-auto">
                Join thousands of recruiters who save hours every week with AI-powered interviews.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="relative overflow-hidden bg-purple-600 text-white px-8 py-6 text-base font-semibold rounded-full shadow-lg group"
                >
                  <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  <span className="relative z-10 group-hover:text-purple-600 transition-colors duration-300">Get Started Free</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © 2024 AIcruiter. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

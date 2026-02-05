import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Shield, 
  Zap, 
  Users, 
  Lock, 
  ArrowRight, 
  CheckCircle,
  TrendingUp,
  Building2,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "OTC Desk", href: "#otc" },
    { name: "Instant Swap", href: "#swap" },
    { name: "Compliance", href: "#compliance" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">
              Kuznex
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover-elevate"
                data-testid={`link-nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">
                Login
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md hover-elevate"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover-elevate"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-border/50 mt-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" data-testid="button-mobile-login">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">FIU-IND Regulated Entity</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-foreground">
            Institutional-Grade
          </span>
          <br />
          <span className="text-primary">
            Crypto Trading
          </span>
          <br />
          <span className="text-foreground">for Everyone.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Seamless INR On-Ramp/Off-Ramp & Zero-Slippage Swaps. 
          <span className="text-foreground"> Powered by Kuznex Proprietary Capital.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="text-base px-8" data-testid="button-start-trading">
              Start Trading
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-view-rates">
            View Live Rates
            <TrendingUp className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { label: "Daily Volume", value: "$50M+" },
            { label: "Active Traders", value: "10,000+" },
            { label: "Uptime", value: "99.99%" },
            { label: "Support", value: "24/7" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-foreground" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBadgeSection() {
  return (
    <section id="compliance" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground" data-testid="text-trust-heading">
                  Licensed & Regulated Entity
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  Registered under Indian Companies Act (CIN: U72900DL2026PTCXXXXX). 
                  Regulated Reporting Entity with FIU-IND. Verified for AML Compliance.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {["Companies Act Registered", "FIU-IND Compliant", "AML Verified", "KYC Enabled"].map((badge) => (
                    <div 
                      key={badge}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 rounded-xl bg-secondary border border-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1" data-testid="text-proprietary-capital">
                    Proprietary Capital Trading
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    We trade with proprietary capital only. No external user funds, no custody risk. 
                    Your funds remain in your control at all times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      id: "swap",
      icon: Zap,
      title: "Instant Swap",
      description: "Convert USDT/BTC to INR instantly with zero fees. Lightning-fast execution with best market rates.",
    },
    {
      id: "otc",
      icon: Users,
      title: "OTC Desk",
      description: "High volume trading for HNI individuals. Dedicated relationship managers and competitive spreads.",
    },
    {
      id: "security",
      icon: Lock,
      title: "Bank-Grade Security",
      description: "2FA Protected & SSL Encrypted. Enterprise-level security protocols to safeguard your assets.",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
            Why Choose Kuznex?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of crypto trading with our institutional-grade infrastructure 
            and regulatory compliance.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card 
              key={feature.id} 
              id={feature.id}
              className="relative overflow-hidden border-border/50 hover-elevate transition-all duration-300"
            >
              <div className="p-8">
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-foreground" data-testid={`text-feature-${feature.id}`}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-foreground">
          Ready to Start Trading?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of traders who trust Kuznex for their crypto trading needs. 
          Start with as little as INR 1,000.
        </p>
        
        <Link href="/login">
          <Button size="lg" className="text-base px-10" data-testid="button-cta-start">
            Get Started Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Kuznex
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Institutional-grade crypto trading platform. Secure, compliant, and trusted by thousands.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>Kuznex Pvt Ltd</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Products</h4>
            <ul className="space-y-2">
              {["Instant Swap", "OTC Desk", "P2P Trading", "API Access"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-footer-${item.toLowerCase().replace(/\s/g, '-')}`}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {["About Us", "Careers", "Blog", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-footer-${item.toLowerCase().replace(/\s/g, '-')}`}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Risk Disclosure", "AML Policy"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-footer-${item.toLowerCase().replace(/\s/g, '-')}`}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} Kuznex Pvt Ltd. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-address">
              Mathura, Uttar Pradesh, India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBadgeSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

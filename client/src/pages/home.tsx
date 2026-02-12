import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Menu,
  X,
  Wallet,
  Globe,
  BarChart3,
  ArrowLeftRight,
  CreditCard,
  ScanFace,
  Lock,
  Layers,
  ChevronRight,
  MoveRight,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import kuznexLogo from "@assets/image_1770554564085.png";
import DatabaseWithRestApi from "@/components/ui/database-with-rest-api";

function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return position;
}

function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-30 dark:opacity-20 ${className}`}
      style={{
        animation: `float ${8 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Platform", href: "#platform" },
    { name: "Networks", href: "#networks" },
    { name: "Security", href: "#security" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-background/80 backdrop-blur-2xl border-b border-border/40" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-md hover-elevate"
                data-testid={`link-nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/30 bg-background/95 backdrop-blur-2xl">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground rounded-md hover-elevate"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-border/30 mt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full" data-testid="button-mobile-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" data-testid="button-mobile-get-started">
                    Get Started
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
  const mouse = useMousePosition();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["seamless", "secure", "powerful", "intelligent", "multichain"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb className="w-[500px] h-[500px] bg-primary/20 top-[10%] left-[5%]" delay={0} />
        <FloatingOrb className="w-[400px] h-[400px] bg-primary/15 bottom-[15%] right-[10%]" delay={2} />
        <FloatingOrb className="w-[300px] h-[300px] bg-primary/10 top-[50%] left-[50%]" delay={4} />

        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03] dark:opacity-[0.02]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
            left: `${mouse.x - 300}px`,
            top: `${mouse.y - 300}px`,
            transition: "left 0.3s ease-out, top 0.3s ease-out",
          }}
        />

        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/[0.04] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/[0.03] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/[0.02] rounded-full" />
        </div>
      </div>

      <div className="relative w-full">
        <div className="container mx-auto">
          <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
            <div>
              <Link href="#platform">
                <Button variant="secondary" size="sm" className="gap-4" data-testid="button-hero-badge">
                  Explore the Kuznex platform <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="flex gap-4 flex-col">
              <h1
                className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular"
                data-testid="text-hero-heading"
              >
                <span className="text-foreground">Crypto trading made</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                  &nbsp;
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -150 : 150,
                              opacity: 0,
                            }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
              </h1>

              <p
                className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center"
                data-testid="text-hero-description"
              >
                A unified platform to manage, trade, and grow your
                digital asset portfolio across multiple networks — with
                complete transparency at every step.
              </p>
            </div>
            <div className="flex flex-row gap-3">
              <a href="#platform">
                <Button size="lg" className="gap-4" variant="outline" data-testid="button-explore-platform">
                  Explore Platform <MoveRight className="w-4 h-4" />
                </Button>
              </a>
              <Link href="/login">
                <Button size="lg" className="gap-4" data-testid="button-start-trading">
                  Get Started <MoveRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="w-5 h-9 rounded-full border-2 border-muted-foreground/20 flex items-start justify-center pt-2">
          <div className="w-1 h-2.5 rounded-full bg-muted-foreground/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

function GlassCard3D({
  children,
  className = "",
  tiltStrength = 8,
  testId,
}: {
  children: React.ReactNode;
  className?: string;
  tiltStrength?: number;
  testId?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -tiltStrength;
    const rotateY = (x - 0.5) * tiltStrength;
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare({ x: x * 100, y: y * 100, opacity: 0.08 });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden transition-transform duration-300 ease-out ${className}`}
      style={{ transform, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-testid={testId}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-md z-10"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}

function PlatformSection() {
  const capabilities = [
    {
      icon: ArrowLeftRight,
      title: "Instant Swap",
      description: "Convert between assets with live market pricing and transparent fee breakdowns.",
    },
    {
      icon: BarChart3,
      title: "Spot Trading",
      description: "Advanced charting, real-time order execution, and detailed market analysis tools.",
    },
    {
      icon: CreditCard,
      title: "INR Gateway",
      description: "Seamless fiat on-ramp and off-ramp with multiple payment method support.",
    },
    {
      icon: Globe,
      title: "Multichain Deposits",
      description: "Receive assets across supported networks with automated balance detection.",
    },
    {
      icon: ScanFace,
      title: "AI Identity Verification",
      description: "Intelligent document analysis for fast, accurate account verification.",
    },
    {
      icon: Wallet,
      title: "Portfolio Intelligence",
      description: "Real-time portfolio tracking with historical performance and daily snapshots.",
    },
  ];

  return (
    <section id="platform" className="py-32 relative">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb className="w-[350px] h-[350px] bg-primary/10 top-[20%] right-[5%]" delay={1} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <p className="text-sm font-medium text-primary mb-3 tracking-wider uppercase" data-testid="text-platform-label">
              Platform
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-foreground leading-tight" data-testid="text-platform-heading">
              Built for precision.
              <br />
              <span className="text-muted-foreground">Designed for clarity.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed" data-testid="text-platform-description">
              Every tool on Kuznex is crafted to give you complete control
              over your digital asset operations — from swap to settlement.
            </p>
          </div>

          <div className="flex items-center justify-center" data-testid="visual-api-animation">
            <DatabaseWithRestApi
              badgeTexts={{
                first: "SWAP",
                second: "TRADE",
                third: "DEPOSIT",
                fourth: "WITHDRAW",
              }}
              buttonTexts={{
                first: "Kuznex",
                second: "multichain",
              }}
              title="Asset operations via secure API layer"
              circleText="API"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((cap, i) => (
            <GlassCard3D key={i} testId={`card-capability-${i}`}>
              <Card className="h-full border-border/50">
                <div className="p-7">
                  <div className="w-11 h-11 rounded-lg bg-primary/8 dark:bg-primary/10 border border-primary/10 dark:border-primary/15 flex items-center justify-center mb-5">
                    <cap.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-foreground" data-testid={`text-cap-title-${i}`}>
                    {cap.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-cap-desc-${i}`}>
                    {cap.description}
                  </p>
                </div>
              </Card>
            </GlassCard3D>
          ))}
        </div>
      </div>
    </section>
  );
}

function NetworksSection() {
  const networks = [
    { name: "Ethereum", short: "ETH" },
    { name: "BNB Chain", short: "BSC" },
    { name: "Polygon", short: "MATIC" },
    { name: "Base", short: "BASE" },
    { name: "Arbitrum", short: "ARB" },
    { name: "Optimism", short: "OP" },
    { name: "Avalanche", short: "AVAX" },
    { name: "Fantom", short: "FTM" },
  ];

  return (
    <section id="networks" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb className="w-[400px] h-[400px] bg-primary/10 bottom-[10%] left-[10%]" delay={3} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-primary mb-3 tracking-wider uppercase" data-testid="text-networks-label">
            Networks
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-foreground" data-testid="text-networks-heading">
            One address. Multiple chains.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed" data-testid="text-networks-description">
            Deposit on any supported network. Your balance is
            automatically detected and credited.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {networks.map((network, i) => (
            <GlassCard3D key={network.short} tiltStrength={12} testId={`card-network-${network.short.toLowerCase()}`}>
              <Card className="border-border/50">
                <div className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-primary/8 to-primary/3 dark:from-primary/12 dark:to-primary/5 border border-primary/10 dark:border-primary/15 flex items-center justify-center mb-4">
                    <Layers className="w-6 h-6 text-primary/70" />
                  </div>
                  <p className="font-semibold text-foreground text-sm" data-testid={`text-network-name-${i}`}>
                    {network.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{network.short}</p>
                </div>
              </Card>
            </GlassCard3D>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const pillars = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All sensitive data is encrypted at rest and in transit using advanced cryptographic standards.",
    },
    {
      icon: Shield,
      title: "Access Control",
      description: "Multi-layered authentication with role-based permissions and session management.",
    },
    {
      icon: Globe,
      title: "Continuous Monitoring",
      description: "Automated systems watch every transaction across all supported networks around the clock.",
    },
  ];

  return (
    <section id="security" className="py-32 relative">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb className="w-[300px] h-[300px] bg-primary/10 top-[30%] right-[15%]" delay={2} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-medium text-primary mb-3 tracking-wider uppercase" data-testid="text-security-label">
              Security
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-foreground leading-tight" data-testid="text-security-heading">
              Your assets deserve
              <br />
              <span className="text-muted-foreground">serious protection.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed" data-testid="text-security-description">
              Security is foundational, not an afterthought.
              Every layer of Kuznex is designed to safeguard
              your data and digital assets.
            </p>

            <div className="space-y-6">
              {pillars.map((pillar, i) => (
                <div key={i} className="flex items-start gap-4" data-testid={`security-pillar-${i}`}>
                  <div className="w-10 h-10 rounded-lg bg-primary/8 dark:bg-primary/10 border border-primary/10 dark:border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <pillar.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">{pillar.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <GlassCard3D tiltStrength={6} testId="card-security-visual">
              <Card className="border-border/50">
                <div className="p-8 sm:p-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center mb-8">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-3">
                    {[
                      "Private key encryption",
                      "Secure session management",
                      "Automated compliance checks",
                      "Identity verification protocols",
                      "Tax deduction handling",
                      "Role-based access controls",
                    ].map((item, idx) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 dark:bg-secondary/30 border border-border/50"
                        data-testid={`security-item-${idx}`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-sm text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </GlassCard3D>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Create your account",
      description: "Register in seconds. Your unique deposit addresses are generated across all supported networks automatically.",
    },
    {
      num: "02",
      title: "Verify your identity",
      description: "Upload your documents for AI-powered verification. The process is fast, private, and secure.",
    },
    {
      num: "03",
      title: "Fund and trade",
      description: "Deposit crypto or fiat, then swap, trade, or manage your portfolio with full transparency.",
    },
  ];

  return (
    <section className="py-32 relative">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-primary mb-3 tracking-wider uppercase" data-testid="text-steps-label">
            Getting Started
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-foreground" data-testid="text-steps-heading">
            Three steps. That's it.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative" data-testid={`step-${step.num}`}>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full z-10">
                  <div className="flex items-center px-4">
                    <div className="flex-1 border-t border-dashed border-border/60" />
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 -ml-1" />
                  </div>
                </div>
              )}
              <GlassCard3D tiltStrength={6} testId={`card-step-${i}`}>
                <Card className="h-full border-border/50">
                  <div className="p-7">
                    <div className="text-5xl font-bold text-primary/10 dark:text-primary/15 mb-4 select-none">
                      {step.num}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3" data-testid={`text-step-title-${i}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-step-desc-${i}`}>
                      {step.description}
                    </p>
                  </div>
                </Card>
              </GlassCard3D>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb className="w-[500px] h-[500px] bg-primary/10 top-[20%] left-[30%]" delay={1} />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-foreground leading-tight" data-testid="text-cta-heading">
          Ready to get started?
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-10 text-lg leading-relaxed" data-testid="text-cta-description">
          Create your account, verify your identity, and access the
          full Kuznex platform in minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" data-testid="button-cta-start">
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" data-testid="button-cta-login">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={kuznexLogo} alt="Kuznex" className="h-7 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A complete digital asset platform for trading, managing, and growing your crypto portfolio.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground text-sm mb-4">Products</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Instant Swap", href: "/swap" },
                { name: "Spot Trading", href: "/trade" },
                { name: "INR Ramp", href: "/inr" },
                { name: "Deposits", href: "/deposit" },
                { name: "Portfolio", href: "/dashboard" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover-elevate rounded-md px-1 py-0.5 inline-block"
                    data-testid={`link-footer-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { name: "About Us", href: "/about" },
                { name: "Contact Us", href: "/contact" },
                { name: "Dashboard", href: "/dashboard" },
                { name: "Verification", href: "/kyc" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover-elevate rounded-md px-1 py-0.5 inline-block"
                    data-testid={`link-footer-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { name: "Privacy Policy", href: "/legal/privacy-policy" },
                { name: "Terms of Service", href: "/legal/terms" },
                { name: "Risk Disclosure", href: "/legal/risk-disclosure" },
                { name: "Refund Policy", href: "/legal/refund-policy" },
                { name: "AML Policy", href: "/legal/aml-policy" },
                { name: "TDS Compliance", href: "/legal/tds-compliance" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover-elevate rounded-md px-1 py-0.5 inline-block"
                    data-testid={`link-footer-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap" data-testid="footer-bottom">
            <p className="text-xs text-muted-foreground" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} Kuznex Pvt Ltd. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-address">
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
      <Helmet>
        <title>Kuznex | The Future of Crypto Trading</title>
        <meta name="description" content="Trade Bitcoin, Ethereum, and 300+ cryptocurrencies with INR. The most secure, fast, and user-friendly crypto exchange built for the next generation. Join Kuznex today." />
        <meta property="og:site_name" content="Kuznex" />
        <meta property="og:title" content="Kuznex | Trade Crypto with Confidence" />
        <meta property="og:description" content="Join the fastest growing crypto exchange. Zero fees on first deposit. Sign up now." />
        <link rel="canonical" href="https://kuznex.in/" />
      </Helmet>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-5px); }
          75% { transform: translateY(-25px) translateX(8px); }
        }
      `}</style>
      <Navbar />
      <main>
        <HeroSection />
        <PlatformSection />
        <NetworksSection />
        <SecuritySection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

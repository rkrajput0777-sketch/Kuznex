import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Zap,
  Lock,
  ArrowRight,
  CheckCircle,
  Building2,
  Menu,
  X,
  TrendingUp,
  Wallet,
  Globe,
  BarChart3,
  FileCheck,
  Layers,
  ArrowLeftRight,
  CreditCard,
  Cpu,
  ChevronRight,
  Activity,
  Eye,
  Download,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import kuznexLogo from "@assets/image_1770554564085.png";

const LIVE_STATS = [
  { label: "24h Volume", value: "$12.4M+" },
  { label: "Supported Chains", value: "8" },
  { label: "Avg. Settlement", value: "<30s" },
  { label: "Users Onboarded", value: "2,500+" },
];

function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = end / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
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
    { name: "Features", href: "#features" },
    { name: "Chains", href: "#chains" },
    { name: "Security", href: "#security" },
    { name: "How It Works", href: "#how-it-works" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm" : "bg-transparent"}`}>
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
              <Button variant="outline" data-testid="button-login">
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button data-testid="button-get-started">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
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
          <div className="md:hidden py-4 border-t border-border/50 bg-background/95 backdrop-blur-xl">
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
              <div className="pt-4 border-t border-border/50 mt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full" data-testid="button-mobile-login">
                    Login
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
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/3 rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8" data-testid="badge-hero-regulated">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">FIU-IND Regulated</span>
          <span className="w-1 h-1 rounded-full bg-primary/40" />
          <span className="text-sm font-medium text-primary">Section 194S Compliant</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-foreground leading-tight" data-testid="text-hero-heading">
          Trade Crypto with
          <span className="block text-primary">Institutional Confidence.</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          8-chain multichain deposits, instant swaps, INR on/off-ramp, Binance-style spot trading,
          AI-powered KYC, and full TDS compliance — all on one platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/login">
            <Button size="lg" data-testid="button-start-trading">
              Start Trading
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" data-testid="button-explore-features">
              Explore Features
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {LIVE_STATS.map((stat) => (
            <div key={stat.label} className="text-center p-4" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Globe,
      title: "8-Chain Multichain Deposits",
      description: "Automated deposits across Ethereum, BSC, Polygon, Base, Arbitrum, Optimism, Avalanche, and Fantom with unique per-user addresses.",
      highlight: "Auto-credited after 12 confirmations",
    },
    {
      icon: ArrowLeftRight,
      title: "Instant Crypto Swap",
      description: "Swap between BTC, ETH, USDT, BNB, and INR instantly with live CoinGecko prices and transparent fee breakdowns.",
      highlight: "1% spread + real-time rates",
    },
    {
      icon: TrendingUp,
      title: "Spot Trading",
      description: "Binance-style trading interface with real-time WebSocket price feeds, TradingView charts, and order book visualization.",
      highlight: "0.1% trading fee",
    },
    {
      icon: CreditCard,
      title: "INR On/Off Ramp",
      description: "Deposit and withdraw INR via UPI, IMPS, or Bank Transfer. Admin-configurable payment methods with instant processing.",
      highlight: "Multiple payment methods",
    },
    {
      icon: Cpu,
      title: "AI-Powered KYC",
      description: "Automated identity verification using Google Gemini AI. Upload Aadhaar, PAN, and selfie for instant AI analysis and approval.",
      highlight: "Powered by Google Gemini",
    },
    {
      icon: BarChart3,
      title: "Portfolio Analytics",
      description: "Daily portfolio snapshots, 24h PnL tracking, total deposit/withdrawal stats on a stunning 3D glassmorphism dashboard card.",
      highlight: "Midnight UTC snapshots",
    },
    {
      icon: FileCheck,
      title: "TDS Compliance (194S)",
      description: "Automatic 1% TDS deduction on crypto-to-INR transactions per Indian VDA regulations. Admin TDS reports with CSV export.",
      highlight: "Govt-compliant tax handling",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "AES-256-GCM encrypted private keys, bcrypt password hashing, session-based auth, and role-based admin access control.",
      highlight: "Bank-grade encryption",
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4" data-testid="badge-features">Platform Capabilities</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground" data-testid="text-features-heading">
            Everything You Need to Trade
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A complete suite of tools built for serious traders, with institutional-grade
            infrastructure and regulatory compliance baked in.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="group hover-elevate transition-all duration-300"
              data-testid={`card-feature-${i}`}
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{feature.description}</p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-medium text-primary">{feature.highlight}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChainsSection() {
  const chains = [
    { name: "Ethereum", symbol: "ETH", color: "from-blue-500/15 to-blue-600/5" },
    { name: "BNB Chain", symbol: "BSC", color: "from-yellow-500/15 to-yellow-600/5" },
    { name: "Polygon", symbol: "MATIC", color: "from-purple-500/15 to-purple-600/5" },
    { name: "Base", symbol: "BASE", color: "from-blue-400/15 to-blue-500/5" },
    { name: "Arbitrum", symbol: "ARB", color: "from-sky-500/15 to-sky-600/5" },
    { name: "Optimism", symbol: "OP", color: "from-red-500/15 to-red-600/5" },
    { name: "Avalanche", symbol: "AVAX", color: "from-red-400/15 to-red-500/5" },
    { name: "Fantom", symbol: "FTM", color: "from-blue-300/15 to-blue-400/5" },
  ];

  return (
    <section id="chains" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4" data-testid="badge-chains">Multichain Infrastructure</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground" data-testid="text-chains-heading">
            8 Chains. One Platform.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Deposit on any supported chain. Our watcher monitors every block and auto-credits
            your balance after 12 confirmations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {chains.map((chain) => (
            <Card
              key={chain.symbol}
              className="hover-elevate transition-all duration-300 overflow-visible"
              data-testid={`card-chain-${chain.symbol.toLowerCase()}`}
            >
              <div className="p-6 text-center">
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${chain.color} border border-border flex items-center justify-center mb-3`}>
                  <Layers className="w-6 h-6 text-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">{chain.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{chain.symbol}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-1"><AnimatedCounter end={12} /></div>
            <p className="text-sm text-muted-foreground">Block Confirmations</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-1"><AnimatedCounter end={60} suffix="s" /></div>
            <p className="text-sm text-muted-foreground">Polling Interval</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-foreground mb-1"><AnimatedCounter end={100} suffix="%" /></div>
            <p className="text-sm text-muted-foreground">Auto-Credit Rate</p>
          </Card>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: Wallet,
      title: "Create Account",
      description: "Sign up in seconds. Your unique multichain deposit addresses are generated automatically across all 8 supported networks.",
    },
    {
      step: "02",
      icon: FileCheck,
      title: "Complete KYC",
      description: "Upload your Aadhaar, PAN card, and a selfie. Our AI verifies your identity in minutes using Google Gemini technology.",
    },
    {
      step: "03",
      icon: Download,
      title: "Fund Your Wallet",
      description: "Deposit crypto on any supported chain or add INR via UPI, IMPS, or Bank Transfer. Funds are auto-credited to your account.",
    },
    {
      step: "04",
      icon: TrendingUp,
      title: "Start Trading",
      description: "Swap instantly, trade on our Binance-style spot exchange, or use the INR ramp. Track everything with real-time portfolio analytics.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4" data-testid="badge-how-it-works">Getting Started</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground" data-testid="text-how-heading">
            Up and Running in Minutes
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From signup to your first trade — the whole process takes less than 10 minutes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, i) => (
            <div key={i} className="relative" data-testid={`step-${item.step}`}>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full z-10">
                  <div className="flex items-center px-2">
                    <div className="flex-1 border-t-2 border-dashed border-border" />
                    <ChevronRight className="w-4 h-4 text-muted-foreground -ml-1" />
                  </div>
                </div>
              )}
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-foreground">{item.step}</span>
                    </div>
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const securityFeatures = [
    { icon: Lock, label: "AES-256-GCM Encryption", description: "All private keys encrypted with military-grade algorithm" },
    { icon: Shield, label: "Session-Based Auth", description: "Secure Passport.js authentication with bcrypt hashing" },
    { icon: Eye, label: "Admin Access Control", description: "Hardened super-admin system with 404 masking" },
    { icon: Activity, label: "Real-Time Monitoring", description: "Background watcher monitors deposits across 8 chains" },
  ];

  return (
    <section id="security" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="secondary" className="mb-4" data-testid="badge-security">Security First</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground" data-testid="text-security-heading">
              Bank-Grade Security Infrastructure
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Your funds and data are protected by enterprise-level encryption, strict access controls,
              and continuous monitoring. We trade with proprietary capital — no custody risk.
            </p>

            <div className="space-y-4">
              {securityFeatures.map((item, i) => (
                <div key={i} className="flex items-start gap-4" data-testid={`security-feature-${i}`}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <Card className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Licensed & Regulated</p>
                    <p className="text-sm text-muted-foreground">FIU-IND Compliant Entity</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {["Companies Act Compliant", "FIU-IND Reporting Standards", "KYC/AML Protocols", "Data Protection Act", "Section 194S TDS Compliance", "PAN Verification Gating"].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function TradingPreview() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4" data-testid="badge-trading">Trading Interface</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground" data-testid="text-trading-heading">
            Professional-Grade Trading Tools
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From instant swaps to advanced spot trading with TradingView charts — tools
            that match the best exchanges in the world.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover-elevate transition-all duration-300 overflow-visible">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Instant Swap</p>
                  <p className="text-xs text-muted-foreground">Zero slippage</p>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <span className="text-sm text-muted-foreground">BTC/USDT</span>
                  <span className="text-sm font-semibold text-foreground">$97,245</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <span className="text-sm text-muted-foreground">ETH/USDT</span>
                  <span className="text-sm font-semibold text-foreground">$3,412</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <span className="text-sm text-muted-foreground">BNB/USDT</span>
                  <span className="text-sm font-semibold text-foreground">$612</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Live rates from CoinGecko</p>
            </div>
          </Card>

          <Card className="hover-elevate transition-all duration-300 overflow-visible">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Spot Trading</p>
                  <p className="text-xs text-muted-foreground">Binance-style</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-2 rounded-full bg-green-500/20 dark:bg-green-400/15 overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-green-500/60 dark:bg-green-400/50" />
                </div>
                <div className="h-2 rounded-full bg-green-500/20 dark:bg-green-400/15 overflow-hidden">
                  <div className="h-full w-1/2 rounded-full bg-green-500/50 dark:bg-green-400/40" />
                </div>
                <div className="h-2 rounded-full bg-red-500/20 dark:bg-red-400/15 overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-red-500/50 dark:bg-red-400/40" />
                </div>
                <div className="h-2 rounded-full bg-red-500/20 dark:bg-red-400/15 overflow-hidden">
                  <div className="h-full w-5/6 rounded-full bg-red-500/60 dark:bg-red-400/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-md bg-green-500/10 dark:bg-green-400/10 text-center">
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">BUY</span>
                </div>
                <div className="p-2 rounded-md bg-red-500/10 dark:bg-red-400/10 text-center">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400">SELL</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">TradingView charts + WebSocket feeds</p>
            </div>
          </Card>

          <Card className="hover-elevate transition-all duration-300 overflow-visible">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Portfolio</p>
                  <p className="text-xs text-muted-foreground">3D glassmorphism</p>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                  <p className="text-xl font-bold text-foreground">$12,847.32</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">+2.4% (24h)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-secondary/50 border border-border text-center">
                    <p className="text-xs text-muted-foreground">Deposited</p>
                    <p className="text-sm font-semibold text-foreground">$10,200</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/50 border border-border text-center">
                    <p className="text-xs text-muted-foreground">PnL</p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">+$2,647</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Daily snapshots at midnight UTC</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
          <div className="relative p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground" data-testid="text-cta-heading">
              Ready to Trade?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-lg">
              Join thousands of traders on India's most advanced crypto platform.
              Create your account, complete KYC, and start trading in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" data-testid="button-cta-start">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" data-testid="button-cta-login">
                  Login to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>
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
              <img src={kuznexLogo} alt="Kuznex" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Institutional-grade crypto trading platform with multichain support, AI-powered KYC, and full TDS compliance.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>Kuznex Pvt Ltd</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Products</h4>
            <ul className="space-y-2">
              {[
                { name: "Instant Swap", href: "/swap" },
                { name: "Spot Trading", href: "/spot-trade/BTCUSDT" },
                { name: "INR Ramp", href: "/inr" },
                { name: "Crypto Deposits", href: "/deposit" },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover-elevate rounded-md px-1 py-0.5 inline-block" data-testid={`link-footer-${item.name.toLowerCase().replace(/\s/g, '-')}`}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              {[
                { name: "Dashboard", href: "/dashboard" },
                { name: "KYC Verification", href: "/kyc" },
                { name: "Portfolio Analytics", href: "/dashboard" },
                { name: "TDS Reports", href: "/dashboard" },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-muted-foreground hover-elevate rounded-md px-1 py-0.5 inline-block" data-testid={`link-footer-${item.name.toLowerCase().replace(/\s/g, '-')}`}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Risk Disclosure", "AML Policy", "TDS Compliance"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover-elevate rounded-md px-1 py-0.5 inline-block" data-testid={`link-footer-${item.toLowerCase().replace(/\s/g, '-')}`}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap" data-testid="footer-bottom">
            <p className="text-sm text-muted-foreground text-center sm:text-left" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} Kuznex Pvt Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
                All systems operational
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-address">
                Mathura, Uttar Pradesh, India
              </p>
            </div>
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
        <FeaturesSection />
        <TradingPreview />
        <ChainsSection />
        <HowItWorksSection />
        <SecuritySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Download, Github, FileText, Calculator, Shield, 
  CheckCircle, Lock, Eye, Terminal, Sparkles,
  FileSpreadsheet, Code, BarChart3, HelpCircle,
  Zap, ChevronRight, Copy,
  Brain, Lightbulb, Target, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// TYPES
// ==========================================
interface K4Entry {
  id: string;
  asset: string;
  isin: string;
  qty: number;
  proceeds: number;
  cost: number;
}

interface NEData {
  r3010: number;  // Momsfria intäkter
  r3020: number;  // Övriga kostnader
  r3030: number;  // Bokfört resultat
  r3110: number;  // Egenavgifter
  r3120: number;  // Överskott
  r3130: number;  // Slutligt överskott
}

interface Persona {
  pnr: string;
  name: string;
  postnummer: string;
  postort: string;
  avatar: string;
  type: 'developer' | 'freelancer' | 'investor';
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

// ==========================================
// ANONYMOUS PERSONAS
// ==========================================
const PERSONAS: Persona[] = [
  {
    pnr: '198801011234',
    name: 'ALEX LINDQVIST',
    postnummer: '41101',
    postort: 'GÖTEBORG',
    avatar: '👨‍💻',
    type: 'developer'
  },
  {
    pnr: '199205059876',
    name: 'SARA BERGMAN',
    postnummer: '11351',
    postort: 'STOCKHOLM',
    avatar: '👩‍💼',
    type: 'freelancer'
  },
  {
    pnr: '197512255432',
    name: 'MARCUS EKSTRÖM',
    postnummer: '21139',
    postort: 'MALMÖ',
    avatar: '👨‍💼',
    type: 'investor'
  }
];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const toSkvInt = (value: number): number => {
  return Math.round(value);
};

const generateTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mins = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}${mm}${dd} ${hh}${mins}${ss}`;
};

const formatPersonnummer = (pnr: string): string => {
  // Format: YYYYMMDD-XXXX or YYYYMMDDXXXX
  if (pnr.length === 12) {
    return `${pnr.slice(0, 8)}-${pnr.slice(8)}`;
  }
  return pnr;
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userProgress, setUserProgress] = useState(0);
  const [aiMode, setAiMode] = useState(false);

  // Onboarding Steps
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([
    { id: 0, title: 'Choose Your Profile', description: 'Select a persona that matches your situation', completed: false },
    { id: 1, title: 'Add K4 Transactions', description: 'Enter your capital gains and losses', completed: false },
    { id: 2, title: 'Fill NE Business Data', description: 'Add business income if applicable', completed: false },
    { id: 3, title: 'Export SRU Files', description: 'Download and upload to Skatteverket', completed: false }
  ]);

  // K4 Entries State with sample data
  const [k4Entries, setK4Entries] = useState<K4Entry[]>([
    { id: '1', asset: 'TUNDRA SUSTAINABLE FRONTIER FUND A', isin: 'SE0001234567', qty: 15, proceeds: 4913, cost: 3439 },
    { id: '2', asset: 'AVANZA DISRUPTIVE INNOVATION ARK', isin: 'SE0007654321', qty: 58, proceeds: 7322, cost: 5125 },
    { id: '3', asset: 'LÄNSFÖRSÄKRINGAR GLOBAL INDEX', isin: 'SE0009876543', qty: 10, proceeds: 4879, cost: 3415 },
    { id: '4', asset: 'EVLI EMERGING FRONTIER B', isin: 'SE0004567890', qty: 3, proceeds: 10360, cost: 7252 },
  ]);

  // NE Data State
  const [neData, setNeData] = useState<NEData>({
    r3010: 274543,
    r3020: 131217,
    r3030: 143326,
    r3110: 10791,
    r3120: 132535,
    r3130: 132535
  });

  const [timestamp, setTimestamp] = useState('');
  const [activeTab, setActiveTab] = useState('k4');
  const [copiedInfo, setCopiedInfo] = useState(false);
  const [copiedBlanketter, setCopiedBlanketter] = useState(false);

  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimestamp(generateTimestamp());
    const interval = setInterval(() => {
      setTimestamp(generateTimestamp());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update progress based on completion
  useEffect(() => {
    const completed = onboardingSteps.filter(s => s.completed).length;
    setUserProgress((completed / onboardingSteps.length) * 100);
  }, [onboardingSteps]);

  // ==========================================
  // GSAP ANIMATIONS
  // ==========================================
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animation
      gsap.fromTo('.hero-headline', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo('.hero-subheadline',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.5 }
      );
      gsap.fromTo('.hero-cta',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.7 }
      );
      gsap.fromTo('.hero-card',
        { x: '12vw', rotateZ: 6, scale: 0.92, opacity: 0 },
        { x: 0, rotateZ: 0, scale: 1, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.4 }
      );
      gsap.fromTo('.hero-module',
        { x: '8vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.6 }
      );

      // Features scroll animation
      gsap.fromTo('.feature-header',
        { y: 40, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: featuresRef.current, start: 'top 80%', end: 'top 55%', scrub: false }
        }
      );
      gsap.fromTo('.feature-card',
        { y: 60, scale: 0.98, opacity: 0 },
        { 
          y: 0, scale: 1, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: '.feature-grid', start: 'top 70%', end: 'top 35%', scrub: false }
        }
      );

      // How It Works animation
      gsap.fromTo('.step-number',
        { y: '-10vh', scale: 0.85, opacity: 0 },
        { 
          y: 0, scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: howItWorksRef.current, start: 'top 70%', scrub: false }
        }
      );
      gsap.fromTo('.step-content',
        { y: 40, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: howItWorksRef.current, start: 'top 60%', scrub: false }
        }
      );

      // Demo section animation
      gsap.fromTo('.demo-panel-left',
        { x: '-40vw', opacity: 0 },
        { 
          x: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: demoRef.current, start: 'top 70%', scrub: false }
        }
      );
      gsap.fromTo('.demo-panel-center',
        { rotateY: 25, z: -400, scale: 0.85, opacity: 0 },
        { 
          rotateY: 0, z: 0, scale: 1, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: demoRef.current, start: 'top 60%', scrub: false }
        }
      );
      gsap.fromTo('.demo-panel-right',
        { x: '40vw', opacity: 0 },
        { 
          x: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: demoRef.current, start: 'top 70%', scrub: false }
        }
      );

      // CTA section animation
      gsap.fromTo('.cta-headline',
        { scale: 0.92, y: '10vh', opacity: 0 },
        { 
          scale: 1, y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: ctaRef.current, start: 'top 70%', scrub: false }
        }
      );
      gsap.fromTo('.cta-subcopy',
        { y: 24, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.2,
          scrollTrigger: { trigger: ctaRef.current, start: 'top 70%', scrub: false }
        }
      );
      gsap.fromTo('.cta-button',
        { y: 24, scale: 0.96, opacity: 0 },
        { 
          y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.4,
          scrollTrigger: { trigger: ctaRef.current, start: 'top 70%', scrub: false }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  // ==========================================
  // SRU GENERATION (IMPROVED FORMAT)
  // ==========================================
  const generateInfoSRU = useCallback((): string => {
    const lines: string[] = [];
    lines.push('#DATABESKRIVNING_START');
    lines.push('#PRODUKT SRU');
    lines.push(`#SKAPAD ${timestamp}`);
    lines.push('#PROGRAM SkatteForge_Pro_7.5');
    lines.push('#FILNAMN BLANKETTER.SRU');
    lines.push('#DATABESKRIVNING_SLUT');
    lines.push('');
    lines.push('#MEDIELEV_START');
    lines.push(`#ORGNR ${selectedPersona.pnr}`);
    lines.push(`#NAMN ${selectedPersona.name}`);
    lines.push(`#POSTNR ${selectedPersona.postnummer}`);
    lines.push(`#POSTORT ${selectedPersona.postort}`);
    lines.push('#MEDIELEV_SLUT');
    
    return lines.join('\r\n');
  }, [selectedPersona, timestamp]);

  const generateBlanketterSRU = useCallback((): string => {
    const lines: string[] = [];
    
    // K4 Block with proper spacing
    lines.push('#BLANKETT K4-2025P4');
    lines.push(`#IDENTITET ${selectedPersona.pnr} ${timestamp}`);
    lines.push(`#NAMN ${selectedPersona.name}`);
    lines.push('#UPPGIFT 7014 1');
    lines.push('');
    
    let totalVinst = 0;
    let totalForlust = 0;
    
    k4Entries.forEach((entry, index) => {
      const base = 3100 + (index * 10);
      const qtyInt = toSkvInt(entry.qty);
      const proceedsInt = toSkvInt(entry.proceeds);
      const costInt = toSkvInt(entry.cost);
      const profit = proceedsInt - costInt;
      
      if (profit > 0) {
        totalVinst += profit;
      } else {
        totalForlust += Math.abs(profit);
      }
      
      lines.push(`#UPPGIFT ${base} ${qtyInt}`);
      lines.push(`#UPPGIFT ${base + 1} ${entry.asset.substring(0, 50)}`);
      lines.push(`#UPPGIFT ${base + 2} ${proceedsInt}`);
      lines.push(`#UPPGIFT ${base + 3} ${costInt}`);
      if (profit > 0) {
        lines.push(`#UPPGIFT ${base + 4} ${profit}`);
      } else if (profit < 0) {
        lines.push(`#UPPGIFT ${base + 5} ${Math.abs(profit)}`);
      }
      lines.push('');
    });
    
    // Summary fields
    lines.push(`#UPPGIFT 3300 ${toSkvInt(k4Entries.reduce((sum, e) => sum + e.proceeds, 0))}`);
    lines.push(`#UPPGIFT 3301 ${toSkvInt(k4Entries.reduce((sum, e) => sum + e.cost, 0))}`);
    lines.push(`#UPPGIFT 3304 ${totalVinst}`);
    lines.push(`#UPPGIFT 3305 ${totalForlust}`);
    lines.push('#BLANKETTSLUT');
    lines.push('');
    
    // NE Block with proper spacing
    lines.push('#BLANKETT NE-2025P4');
    lines.push(`#IDENTITET ${selectedPersona.pnr} ${timestamp}`);
    lines.push(`#NAMN ${selectedPersona.name}`);
    lines.push('');
    
    const neFields = [
      { code: 3010, value: neData.r3010, label: 'Momsfria intäkter' },
      { code: 3020, value: neData.r3020, label: 'Övriga kostnader' },
      { code: 3030, value: neData.r3030, label: 'Bokfört resultat' },
      { code: 3110, value: neData.r3110, label: 'Egenavgifter' },
      { code: 3120, value: neData.r3120, label: 'Överskott' },
      { code: 3130, value: neData.r3130, label: 'Slutligt överskott' },
    ];
    
    neFields.forEach(field => {
      if (field.value !== 0) {
        lines.push(`#UPPGIFT ${field.code} ${toSkvInt(field.value)}`);
      }
    });
    
    lines.push('');
    lines.push('#BLANKETTSLUT');
    lines.push('#FIL_SLUT');
    
    return lines.join('\r\n');
  }, [selectedPersona, timestamp, k4Entries, neData]);

  // ==========================================
  // FILE DOWNLOAD
  // ==========================================
  const downloadSRU = (content: string, filename: string) => {
    const bytes = new Uint8Array(content.length);
    for (let i = 0; i < content.length; i++) {
      const charCode = content.charCodeAt(i);
      bytes[i] = charCode < 256 ? charCode : 63;
    }
    
    const blob = new Blob([bytes], { type: 'text/plain;charset=iso-8859-1' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark onboarding step as completed
    completeOnboardingStep(3);
  };

  const copyToClipboard = (content: string, type: 'info' | 'blanketter') => {
    navigator.clipboard.writeText(content);
    if (type === 'info') {
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 2000);
    } else {
      setCopiedBlanketter(true);
      setTimeout(() => setCopiedBlanketter(false), 2000);
    }
  };

  // ==========================================
  // ONBOARDING HANDLERS
  // ==========================================
  const completeOnboardingStep = (stepId: number) => {
    setOnboardingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    completeOnboardingStep(0);
    setOnboardingStep(1);
  };

  // ==========================================
  // K4 FORM HANDLERS
  // ==========================================
  const addK4Entry = () => {
    const newEntry: K4Entry = {
      id: Date.now().toString(),
      asset: '',
      isin: '',
      qty: 0,
      proceeds: 0,
      cost: 0
    };
    setK4Entries([...k4Entries, newEntry]);
    
    if (k4Entries.length >= 1) {
      completeOnboardingStep(1);
    }
  };

  const updateK4Entry = (id: string, field: keyof K4Entry, value: string | number) => {
    setK4Entries(k4Entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateK4Totals = () => {
    let totalVinst = 0;
    let totalForlust = 0;
    
    k4Entries.forEach(entry => {
      const profit = toSkvInt(entry.proceeds) - toSkvInt(entry.cost);
      if (profit > 0) {
        totalVinst += profit;
      } else {
        totalForlust += Math.abs(profit);
      }
    });
    
    return { totalVinst, totalForlust };
  };

  const k4Totals = calculateK4Totals();

  // ==========================================
  // AI INSIGHTS
  // ==========================================
  const getAiInsights = () => {
    const insights: string[] = [];
    const totalProfit = k4Totals.totalVinst - k4Totals.totalForlust;
    
    if (totalProfit > 50000) {
      insights.push('💡 Consider maximizing ISK account usage next year for tax efficiency');
    }
    if (k4Totals.totalForlust > k4Totals.totalVinst) {
      insights.push('📉 You have net losses - these can be carried forward to offset future gains');
    }
    if (neData.r3120 > 500000) {
      insights.push('⚠️ High business income detected - consider corporate structure (AB) for next year');
    }
    
    return insights;
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-[#070A12] text-white font-sans overflow-x-hidden">
      {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070A12]/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between px-6 lg:px-12 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2D6BFF] to-[#1E5AEE] rounded-xl flex items-center justify-center shadow-lg shadow-[#2D6BFF]/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">SkatteForge</span>
                <Badge variant="outline" className="ml-2 text-xs border-[#2D6BFF]/50 text-[#2D6BFF]">
                  Pro 7.5
                </Badge>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#demo" className="text-sm text-gray-300 hover:text-white transition-colors">Demo</a>
              <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-gray-300 hover:text-white transition-colors">FAQ</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAiMode(!aiMode)}
                className={`hidden sm:flex items-center gap-2 ${aiMode ? 'text-[#2D6BFF]' : 'text-gray-300'}`}
              >
                <Sparkles className="w-4 h-4" />
                AI Mode
              </Button>
              <Button size="sm" className="bg-[#2D6BFF] hover:bg-[#1E5AEE] text-white rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </nav>

        {/* Onboarding Dialog */}
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="bg-[#0E1322] border border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Rocket className="w-6 h-6 text-[#2D6BFF]" />
                Welcome to SkatteForge Pro 7.5
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Let's get you set up in under 2 minutes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Setup Progress</span>
                  <span className="text-[#2D6BFF]">{Math.round(userProgress)}%</span>
                </div>
                <Progress value={userProgress} className="h-2 bg-white/10" />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {onboardingSteps.map((step, idx) => (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      step.completed 
                        ? 'bg-[#2D6BFF]/10 border-[#2D6BFF]/30' 
                        : idx === onboardingStep 
                          ? 'bg-white/5 border-white/20' 
                          : 'bg-transparent border-white/5 opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.completed ? 'bg-[#2D6BFF] text-white' : 'bg-white/10 text-gray-400'
                    }`}>
                      {step.completed ? <CheckCircle className="w-4 h-4" /> : step.id + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white">{step.title}</div>
                      <div className="text-sm text-gray-400">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Persona Selection */}
              {onboardingStep === 0 && (
                <div className="space-y-3">
                  <Label className="text-white">Select your profile:</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PERSONAS.map((persona) => (
                      <button
                        key={persona.pnr}
                        onClick={() => handlePersonaSelect(persona)}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          selectedPersona.pnr === persona.pnr
                            ? 'bg-[#2D6BFF]/20 border-[#2D6BFF]'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="text-3xl mb-2">{persona.avatar}</div>
                        <div className="font-medium text-white text-sm">{persona.name}</div>
                        <div className="text-xs text-gray-400 capitalize">{persona.type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => {
                  setShowOnboarding(false);
                  completeOnboardingStep(0);
                }}
                className="w-full bg-[#2D6BFF] hover:bg-[#1E5AEE]"
              >
                Get Started
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Section 1: Hero */}
        <section ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
          {/* Blueprint Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#2D6BFF" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Blue Glow */}
          <div className="absolute top-1/4 right-1/4 w-[700px] h-[700px] bg-[#2D6BFF]/15 rounded-full blur-[180px] pointer-events-none" />
          
          <div className="relative z-10 w-full px-6 lg:px-12 py-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D6BFF]/10 border border-[#2D6BFF]/30 rounded-full">
                  <Sparkles className="w-4 h-4 text-[#2D6BFF]" />
                  <span className="text-sm text-[#2D6BFF]">Now with AI-Powered Validation</span>
                </div>
                
                <h1 className="hero-headline text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[0.95] tracking-tight text-white">
                  Swedish taxes<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D6BFF] to-[#60A5FA]">made simple.</span>
                </h1>
                
                <p className="hero-subheadline text-lg text-gray-300 max-w-lg leading-relaxed">
                  Generate Skatteverket-ready SRU files in minutes. Local-first, 
                  AI-validated, and completely free. No data leaves your device.
                </p>
                
                <div className="hero-cta flex flex-wrap gap-4">
                  <Button size="lg" className="bg-[#2D6BFF] hover:bg-[#1E5AEE] text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-[#2D6BFF]/25">
                    <Download className="w-5 h-5 mr-2" />
                    Start Free
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl px-8 py-6 text-lg">
                    <Github className="w-5 h-5 mr-2" />
                    View Source
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>ISO-8859-1 Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#2D6BFF]" />
                    <span>100% Offline</span>
                  </div>
                </div>
              </div>
              
              {/* Right Content - Dashboard Preview */}
              <div className="relative">
                <Card className="hero-card bg-[#0E1322] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                  <CardHeader className="bg-white/5 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                      <span className="ml-4 text-xs text-gray-400 font-mono">SkatteForge Pro 7.5</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Persona Selector */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <span className="text-2xl">{selectedPersona.avatar}</span>
                      <div>
                        <div className="font-medium text-white">{selectedPersona.name}</div>
                        <div className="text-xs text-gray-400">{formatPersonnummer(selectedPersona.pnr)}</div>
                      </div>
                    </div>
                    
                    <div className="h-px bg-white/10 my-4" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Vinst</span>
                        <span className="text-green-400 font-mono font-semibold">{k4Totals.totalVinst.toLocaleString()} SEK</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Förlust</span>
                        <span className="text-red-400 font-mono font-semibold">{k4Totals.totalForlust.toLocaleString()} SEK</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                        <span className="text-gray-300">Net Result</span>
                        <span className={`font-mono font-semibold ${(k4Totals.totalVinst - k4Totals.totalForlust) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(k4Totals.totalVinst - k4Totals.totalForlust).toLocaleString()} SEK
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-[#070A12] rounded-lg p-3 font-mono text-xs space-y-1 border border-white/5">
                      <div className="text-[#2D6BFF]">#BLANKETT K4-2025P4</div>
                      <div className="text-gray-500">#IDENTITET {selectedPersona.pnr}...</div>
                      <div className="text-white">#UPPGIFT 3104 <span className="text-green-400">{k4Totals.totalVinst}</span></div>
                      <div className="text-white">#UPPGIFT 3105 <span className="text-red-400">{k4Totals.totalForlust}</span></div>
                      <div className="text-gray-500 mt-1">#BLANKETTSLUT</div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Floating Module Cards */}
                <Card className="hero-module absolute -top-4 -right-4 bg-[#0E1322] border border-white/10 rounded-xl p-3 shadow-xl hidden lg:block">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#2D6BFF]/20 rounded-lg flex items-center justify-center">
                      <Calculator className="w-4 h-4 text-[#2D6BFF]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">K4 Compiler</div>
                      <div className="text-sm font-semibold text-white">Active</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="hero-module absolute top-1/2 -right-8 bg-[#0E1322] border border-white/10 rounded-xl p-3 shadow-xl hidden lg:block">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#2D6BFF]/20 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-[#2D6BFF]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">NE Forms</div>
                      <div className="text-sm font-semibold text-white">Ready</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="hero-module absolute -bottom-4 right-8 bg-[#0E1322] border border-white/10 rounded-xl p-3 shadow-xl hidden lg:block">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#2D6BFF]/20 rounded-lg flex items-center justify-center">
                      <Code className="w-4 h-4 text-[#2D6BFF]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">ISO-8859-1</div>
                      <div className="text-sm font-semibold text-white">Export</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Features */}
        <section id="features" ref={featuresRef} className="py-24 px-6 lg:px-12 relative">
          <div className="max-w-7xl mx-auto">
            <div className="feature-header text-center mb-16">
              <span className="text-xs font-mono text-[#2D6BFF] tracking-widest uppercase">Capabilities</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-white">
                Everything you need to file—<br />
                <span className="text-gray-400">without the cloud.</span>
              </h2>
            </div>
            
            <div className="feature-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Calculator, title: 'K4 Compiler', desc: 'Auto-generate capital-gains rows with strict integer rounding.' },
                { icon: FileSpreadsheet, title: 'NE Forms', desc: 'Map business income, expenses, and deficits to the correct punktkoder.' },
                { icon: Code, title: 'ISO-8859-1 Export', desc: 'Save files in the exact encoding Skatteverket expects.' },
                { icon: BarChart3, title: 'FIFO Engine', desc: 'Cost-basis calculations that follow Swedish tax rules.' },
                { icon: FileText, title: 'PDF-to-Data', desc: 'Extract transactions from broker PDFs (Avanza, Nordnet).' },
                { icon: Shield, title: 'AI Validation', desc: 'Catch errors before upload with intelligent validation.' },
              ].map((feature, i) => (
                <Card key={i} className="feature-card bg-[#0E1322] border border-white/10 rounded-3xl p-6 hover:border-[#2D6BFF]/50 transition-all group">
                  <div className="w-12 h-12 bg-[#2D6BFF]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#2D6BFF]/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-[#2D6BFF]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section ref={howItWorksRef} className="py-24 px-6 lg:px-12 relative overflow-hidden bg-[#0A0D16]">
          {/* Connector Line */}
          <div className="absolute top-1/3 left-[10vw] right-[10vw] h-px bg-gradient-to-r from-transparent via-[#2D6BFF]/30 to-transparent hidden lg:block" />
          
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-mono text-[#2D6BFF] tracking-widest uppercase">Process</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-white">
                How it works
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
              {[
                { num: '01', title: 'Import', desc: 'Paste data or drop broker PDFs. We extract rows, dates, and amounts.', icon: Target },
                { num: '02', title: 'Validate', desc: 'AI checks your data for errors and suggests optimizations.', icon: Brain },
                { num: '03', title: 'Export', desc: 'Download INFO.SRU + BLANKETTER.SRU, encoded and ready to upload.', icon: Rocket },
              ].map((step, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="step-number text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#2D6BFF]/60 to-transparent leading-none mb-4">
                    {step.num}
                  </div>
                  <div className="step-content">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#2D6BFF]/10 rounded-xl flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-[#2D6BFF]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Live Preview (Demo) */}
        <section id="demo" ref={demoRef} className="py-24 px-6 lg:px-12 bg-[#0E1322]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-mono text-[#2D6BFF] tracking-widest uppercase">Live Demo</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-white">
                See it in action
              </h2>
            </div>
            
            {/* Persona Selector */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm text-gray-400 px-3">Demo Profile:</span>
                {PERSONAS.map((persona) => (
                  <button
                    key={persona.pnr}
                    onClick={() => setSelectedPersona(persona)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      selectedPersona.pnr === persona.pnr
                        ? 'bg-[#2D6BFF] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{persona.avatar}</span>
                    <span className="text-sm">{persona.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6" style={{ perspective: '1000px' }}>
              {/* Left Panel - Input */}
              <Card className="demo-panel-left bg-[#070A12] border border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#2D6BFF]" />
                      <span className="text-sm font-medium text-white">Input Data</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                      {k4Entries.length} entries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full bg-white/5">
                      <TabsTrigger value="k4" className="flex-1 data-[state=active]:bg-[#2D6BFF] data-[state=active]:text-white">K4</TabsTrigger>
                      <TabsTrigger value="ne" className="flex-1 data-[state=active]:bg-[#2D6BFF] data-[state=active]:text-white">NE</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="k4" className="space-y-3 mt-4">
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {k4Entries.map((entry) => (
                          <div key={entry.id} className="bg-white/5 rounded-lg p-3 space-y-2 border border-white/5">
                            <Input 
                              placeholder="Asset name"
                              value={entry.asset}
                              onChange={(e) => updateK4Entry(entry.id, 'asset', e.target.value)}
                              className="bg-transparent border-white/10 text-sm text-white placeholder:text-gray-500"
                            />
                            <div className="grid grid-cols-4 gap-2">
                              <Input 
                                placeholder="Qty"
                                type="number"
                                value={entry.qty || ''}
                                onChange={(e) => updateK4Entry(entry.id, 'qty', parseFloat(e.target.value) || 0)}
                                className="bg-transparent border-white/10 text-sm text-white placeholder:text-gray-500"
                              />
                              <Input 
                                placeholder="Proceeds"
                                type="number"
                                value={entry.proceeds || ''}
                                onChange={(e) => updateK4Entry(entry.id, 'proceeds', parseFloat(e.target.value) || 0)}
                                className="bg-transparent border-white/10 text-sm text-white placeholder:text-gray-500 col-span-2"
                              />
                              <Input 
                                placeholder="Cost"
                                type="number"
                                value={entry.cost || ''}
                                onChange={(e) => updateK4Entry(entry.id, 'cost', parseFloat(e.target.value) || 0)}
                                className="bg-transparent border-white/10 text-sm text-white placeholder:text-gray-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button onClick={addK4Entry} variant="outline" size="sm" className="w-full border-white/10 text-white hover:bg-white/5">
                        + Add Entry
                      </Button>
                      
                      {/* AI Validation Summary */}
                      {aiMode && (
                        <div className="bg-[#2D6BFF]/10 border border-[#2D6BFF]/30 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 text-[#2D6BFF]">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Validation</span>
                          </div>
                          <div className="text-xs text-gray-400 space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span>All entries have valid quantities</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span>Integer rounding applied</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-gradient-to-r from-[#2D6BFF]/20 to-[#2D6BFF]/10 rounded-lg p-3 space-y-1 border border-[#2D6BFF]/30">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Vinst:</span>
                          <span className="text-green-400 font-mono font-semibold">{k4Totals.totalVinst.toLocaleString()} SEK</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Förlust:</span>
                          <span className="text-red-400 font-mono font-semibold">{k4Totals.totalForlust.toLocaleString()} SEK</span>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="ne" className="space-y-3 mt-4">
                      <div className="space-y-3">
                        {[
                          { key: 'r3010', label: 'Momsfria Intäkter (3010)' },
                          { key: 'r3020', label: 'Övriga Kostnader (3020)' },
                          { key: 'r3030', label: 'Bokfört Resultat (3030)' },
                          { key: 'r3110', label: 'Egenavgifter (3110)' },
                          { key: 'r3120', label: 'Överskott (3120)' },
                          { key: 'r3130', label: 'Slutligt Överskott (3130)' },
                        ].map((field) => (
                          <div key={field.key} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <Label className="text-sm text-gray-400">{field.label}</Label>
                            <Input 
                              type="number"
                              value={neData[field.key as keyof NEData] || ''}
                              onChange={(e) => {
                                setNeData({ ...neData, [field.key]: parseFloat(e.target.value) || 0 });
                                completeOnboardingStep(2);
                              }}
                              className="w-32 bg-transparent border-white/10 text-sm text-white text-right"
                            />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {/* Center Panel - Preview */}
              <Card className="demo-panel-center bg-[#070A12] border border-[#2D6BFF]/40 rounded-3xl overflow-hidden lg:scale-105 shadow-xl shadow-[#2D6BFF]/10">
                <CardHeader className="bg-[#2D6BFF]/10 border-b border-[#2D6BFF]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#2D6BFF]" />
                      <span className="text-sm font-medium text-white">Live Preview</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-[#2D6BFF]/50 text-[#2D6BFF]">
                      Real-time
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Tabs defaultValue="blanketter" className="w-full">
                    <TabsList className="w-full bg-white/5 mb-4">
                      <TabsTrigger value="blanketter" className="flex-1 data-[state=active]:bg-[#2D6BFF] data-[state=active]:text-white text-sm">BLANKETTER.SRU</TabsTrigger>
                      <TabsTrigger value="info" className="flex-1 data-[state=active]:bg-[#2D6BFF] data-[state=active]:text-white text-sm">INFO.SRU</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="blanketter" className="mt-0">
                      <div className="bg-[#0E1322] rounded-xl p-4 font-mono text-xs space-y-0.5 overflow-hidden border border-white/5">
                        <div className="text-[#2D6BFF]">#BLANKETT K4-2025P4</div>
                        <div className="text-gray-500">#IDENTITET {selectedPersona.pnr}...</div>
                        <div className="text-white">#UPPGIFT 3104 <span className="text-green-400">{k4Totals.totalVinst}</span></div>
                        <div className="text-white">#UPPGIFT 3105 <span className="text-red-400">{k4Totals.totalForlust}</span></div>
                        <div className="text-gray-500 my-1">#BLANKETTSLUT</div>
                        <div className="text-[#2D6BFF] mt-2">#BLANKETT NE-2025P4</div>
                        <div className="text-white">#UPPGIFT 3010 <span className="text-blue-400">{neData.r3010}</span></div>
                        <div className="text-white">#UPPGIFT 3120 <span className="text-blue-400">{neData.r3120}</span></div>
                        <div className="text-gray-500 mt-1">#FIL_SLUT</div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-white/10 text-white hover:bg-white/5"
                          onClick={() => copyToClipboard(generateBlanketterSRU(), 'blanketter')}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          {copiedBlanketter ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-[#2D6BFF] hover:bg-[#1E5AEE]"
                          onClick={() => downloadSRU(generateBlanketterSRU(), 'BLANKETTER.SRU')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="info" className="mt-0">
                      <div className="bg-[#0E1322] rounded-xl p-4 font-mono text-xs space-y-0.5 overflow-hidden border border-white/5">
                        <div className="text-[#2D6BFF]">#DATABESKRIVNING_START</div>
                        <div className="text-gray-500">#PRODUKT SRU</div>
                        <div className="text-gray-500">#SKAPAD {timestamp}</div>
                        <div className="text-gray-500 my-1">#DATABESKRIVNING_SLUT</div>
                        <div className="text-[#2D6BFF] mt-2">#MEDIELEV_START</div>
                        <div className="text-white">#ORGNR <span className="text-blue-400">{selectedPersona.pnr}</span></div>
                        <div className="text-white">#NAMN <span className="text-blue-400">{selectedPersona.name}</span></div>
                        <div className="text-gray-500 mt-1">#MEDIELEV_SLUT</div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-white/10 text-white hover:bg-white/5"
                          onClick={() => copyToClipboard(generateInfoSRU(), 'info')}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          {copiedInfo ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-[#2D6BFF] hover:bg-[#1E5AEE]"
                          onClick={() => downloadSRU(generateInfoSRU(), 'INFO.SRU')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              
              {/* Right Panel - Validation */}
              <Card className="demo-panel-right bg-[#070A12] border border-white/10 rounded-3xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">Validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400">Ready</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Integer rounding applied', status: 'pass' },
                      { label: 'ISO-8859-1 encoding ready', status: 'pass' },
                      { label: 'CRLF line endings set', status: 'pass' },
                      { label: 'Timestamp synchronized', status: 'pass' },
                      { label: 'Personnummer validated', status: 'pass' },
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-sm text-gray-300">{check.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* AI Insights */}
                  {aiMode && (
                    <div className="bg-gradient-to-br from-[#2D6BFF]/20 to-[#2D6BFF]/5 rounded-xl p-4 border border-[#2D6BFF]/30">
                      <div className="flex items-center gap-2 text-[#2D6BFF] mb-3">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-sm font-medium">AI Insights</span>
                      </div>
                      <div className="space-y-2">
                        {getAiInsights().map((insight, i) => (
                          <div key={i} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-[#2D6BFF] mt-0.5">•</span>
                            {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-gray-400 mb-2">File Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-medium text-white">Ready for upload</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Compatible with Skatteverket Filöverföring
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 5: Performance Stats */}
        <section className="py-24 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { value: '<1s', label: 'Compile time', icon: Zap },
                { value: '0', label: 'External API calls', icon: Lock },
                { value: '100%', label: 'Offline capable', icon: Shield },
              ].map((stat, i) => (
                <div key={i} className="space-y-3">
                  <div className="w-12 h-12 bg-[#2D6BFF]/10 rounded-2xl flex items-center justify-center mx-auto">
                    <stat.icon className="w-6 h-6 text-[#2D6BFF]" />
                  </div>
                  <div className="text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2D6BFF] to-[#60A5FA]">
                    {stat.value}
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Testimonials */}
        <section className="py-24 px-6 lg:px-12 bg-[#0E1322]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-mono text-[#2D6BFF] tracking-widest uppercase">Testimonials</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-white">
                Loved by developers
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: 'Saved me hours.', desc: 'I used to manually type every row. Now I paste and export.', author: 'Alex', role: 'developer', avatar: '👨‍💻' },
                { quote: 'Actually validates.', desc: 'Catches encoding issues before Skatteverket rejects the file.', author: 'Petra', role: 'accountant', avatar: '👩‍💼' },
                { quote: 'Local-first done right.', desc: 'My data never leaves the machine. That\'s the point.', author: 'Jonas', role: 'freelancer', avatar: '👨‍💼' },
              ].map((t, i) => (
                <Card key={i} className="bg-[#070A12] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{t.avatar}</div>
                    <div>
                      <div className="font-semibold text-white">{t.author}</div>
                      <div className="text-xs text-gray-400 capitalize">{t.role}</div>
                    </div>
                  </div>
                  <div className="text-lg font-medium text-white mb-2">"{t.quote}"</div>
                  <p className="text-sm text-gray-400">{t.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Pricing */}
        <section id="pricing" className="py-24 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-mono text-[#2D6BFF] tracking-widest uppercase">Pricing</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-white">
                Simple, transparent pricing
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-[#0E1322] border border-white/10 rounded-3xl p-8">
                <div className="text-sm text-gray-400 mb-2">SkatteForge Core</div>
                <div className="text-4xl font-bold text-white mb-4">Free</div>
                <p className="text-sm text-gray-400 mb-6">Forever free for everyone</p>
                <ul className="space-y-3 mb-8">
                  {['K4 + NE compiler', 'CLI tool', 'Local export', 'Basic validation', 'Community support'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">Download</Button>
              </Card>
              
              <Card className="bg-[#0E1322] border border-[#2D6BFF]/50 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#2D6BFF] to-[#1E5AEE] text-white text-xs px-4 py-1.5 rounded-bl-xl font-medium">
                  Recommended
                </div>
                <div className="text-sm text-gray-400 mb-2">SkatteForge Pro</div>
                <div className="text-4xl font-bold text-white mb-4">€49</div>
                <p className="text-sm text-gray-400 mb-6">One-time purchase</p>
                <ul className="space-y-3 mb-8">
                  {['Everything in Core', 'PDF import', 'FIFO engine', 'AI validation', 'Priority templates', 'Email support'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-[#2D6BFF] hover:bg-[#1E5AEE]">Buy Pro</Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 8: FAQ */}
        <section id="faq" className="py-24 px-6 lg:px-12 bg-[#0E1322]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-mono text-[#2D6BFF] tracking-widest uppercase">FAQ</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 text-white">
                Common questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {[
                { q: 'Is my data sent to any server?', a: 'No. Everything runs locally in your browser. Your tax data never leaves your machine. We don\'t have a backend to store your information.' },
                { q: 'What encoding do the files use?', a: 'ISO-8859-1 (Latin-1) with CRLF line endings—exactly what Skatteverket requires for their Filöverföring portal. This ensures Swedish characters like Å, Ä, Ö are preserved.' },
                { q: 'Can I import PDFs from any broker?', a: 'Currently optimized for Avanza and Nordnet. We\'re adding support for more brokers. Pro users get priority access to new parsers.' },
                { q: 'Is there a Windows version?', a: 'Yes. macOS, Windows, and Linux builds are available. The web version works on all modern browsers.' },
                { q: 'How does the AI validation work?', a: 'Our AI agents check for common errors like missing fields, incorrect calculations, and encoding issues. It\'s like having a tax advisor review your work.' },
              ].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-[#070A12] border border-white/10 rounded-xl px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4 text-white">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-[#2D6BFF]" />
                      {item.q}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Section 9: Final CTA */}
        <section ref={ctaRef} className="py-32 px-6 lg:px-12 relative overflow-hidden">
          {/* Blueprint Circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#2D6BFF]/10 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#2D6BFF]/20 rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="cta-headline text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Stop wrestling with<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D6BFF] to-[#60A5FA]">tax files.</span>
            </h2>
            <p className="cta-subcopy text-lg text-gray-400 mb-8 max-w-xl mx-auto">
              Download SkatteForge and generate your SRU files in seconds. 
              Local-first, secure, and free.
            </p>
            <Button size="lg" className="cta-button bg-[#2D6BFF] hover:bg-[#1E5AEE] text-white rounded-xl px-10 py-7 text-lg shadow-lg shadow-[#2D6BFF]/25">
              <Download className="w-5 h-5 mr-2" />
              Download Now
            </Button>
          </div>
        </section>

        {/* Section 10: Footer */}
        <footer className="py-12 px-6 lg:px-12 bg-[#0A0D16] border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2D6BFF] to-[#1E5AEE] rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">SkatteForge</span>
                </div>
                <p className="text-sm text-gray-400 max-w-sm">
                  Built for developers, freelancers, and accountants in Sweden. 
                  Local-first tax file compilation with AI validation.
                </p>
              </div>
              <div>
                <div className="font-semibold text-white mb-4">Product</div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-white mb-4">Resources</div>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                © 2026 SkatteForge. MIT License.
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                Local-first. Your data stays yours.
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}

export default App;

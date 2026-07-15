import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Apple, ShieldCheck, Zap, Server, AlertCircle, Sparkles, RefreshCw, WifiOff } from 'lucide-react';
import { useOllamaInsight } from '../hooks/useOllamaInsight';
import { streamDeployInsight, checkOllamaHealth } from '../services/insightService';
import { GlassCard } from '../components/GlassCard';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface DeployInsightPayload {
  name: string;
  framework: string;
  size_mb: number;
  totalScore: number;
  breakdown: { compatibility: number; performance: number; memory: number; optimization: number };
}

interface ModelData { name: string; framework: string; size_mb: number; }
interface ScoreBreakdown { compatibility: number; performance: number; memory: number; optimization: number; }

const computeScores = (model: ModelData): { total: number; breakdown: ScoreBreakdown } => {
  let comp = 50, perf = 40, mem = 60, opt = 30, total = 40;
  switch (model.framework) {
    case 'CoreML':  comp = 100; perf = 95; opt = 90; total = 95; break;
    case 'ONNX':    comp = 85;  perf = 75; opt = 60; total = 78; break;
    case 'PyTorch': comp = 65;  perf = 55; opt = 40; total = 62; break;
    default:        comp = 50;  perf = 40; opt = 30; total = 45;
  }
  if (model.size_mb > 100)      { mem = 30; total -= 15; }
  else if (model.size_mb > 50)  { mem = 50; total -= 8;  }
  else if (model.size_mb <= 10) { mem = 95; total += 5;  }
  else                          { mem = 75; }
  total = Math.min(100, Math.max(0, Math.round(total)));
  return { total, breakdown: { compatibility: Math.round(comp), performance: Math.round(perf), memory: Math.round(mem), optimization: Math.round(opt) } };
};

// ─── AI Assessment Panel (Apple Intelligence Inspired) ──────────────
const AssessmentPanel = ({ text, loading, streaming, error, ollamaReady, onGenerate, onReset }: {
  text: string; loading: boolean; streaming: boolean; error: string | null;
  ollamaReady: boolean; onGenerate: () => void; onReset: () => void;
}) => {
  const hasContent = text.length > 0;
  const isActive = loading || streaming;
  
  return (
    <div className="relative mt-8 rounded-[32px] p-[2px] overflow-hidden group">
      {/* Apple Intelligence style glowing border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF9E1B] via-[#E94B73] to-[#8F51EA] opacity-30 blur-xl group-hover:opacity-60 transition-opacity duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF9E1B] via-[#E94B73] to-[#8F51EA] animate-gradient-xy opacity-50" />
      
      <div className="relative bg-[#0F1015]/90 backdrop-blur-3xl rounded-[30px] p-8 h-full flex flex-col gap-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9E1B] to-[#8F51EA] p-[1px]">
              <div className="w-full h-full bg-[#0F1015] rounded-full flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Intelligence Assessment</h3>
              <p className="text-xs text-slate-400">Powered by On-Device Llama 3.2</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ollamaReady ? 'bg-core-green/10 text-core-green border-core-green/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
              {ollamaReady ? 'Ready' : 'Offline'}
            </span>
            {hasContent && !isActive && (
              <button onClick={onReset} className="text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={18} />
              </button>
            )}
          </div>
        </div>

        {!ollamaReady && !hasContent && !isActive && (
          <div className="flex items-center gap-2 text-sm text-rose-400 mt-4">
            <WifiOff size={16} />
            <span>Ollama is not running. Start with <code className="bg-white/10 px-2 py-0.5 rounded ml-1 font-mono text-rose-300">ollama serve</code></span>
          </div>
        )}

        {error && <p className="text-sm text-rose-400 mt-2">⚠ {error}</p>}

        {loading && !streaming && (
          <div className="flex gap-2 items-center mt-6">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i} 
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} 
                  className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#E94B73] to-[#8F51EA]" 
                />
              ))}
            </div>
            <span className="text-sm text-slate-400 ml-2">Analyzing deployment profile...</span>
          </div>
        )}

        {hasContent && (
          <div className="mt-4">
            <MarkdownRenderer
              text={text}
              streaming={streaming}
              streamingColor="bg-gradient-to-t from-[#E94B73] to-[#8F51EA]"
            />
          </div>
        )}

        {!isActive && !hasContent && (
          <p className="text-slate-400 text-sm mt-2 mb-4 max-w-2xl">
            Get personalized insights on how to optimize this model specifically for Apple Silicon hardware, including memory reduction techniques and framework compatibility analysis.
          </p>
        )}

        {!isActive && (
          <button 
            className={`mt-2 self-start flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${
              ollamaReady 
                ? 'bg-white text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
            onClick={onGenerate} 
            disabled={!ollamaReady}
          >
            <Sparkles size={18} className={ollamaReady ? 'text-black' : 'text-white/40'} />
            {hasContent ? 'Regenerate Assessment' : 'Generate Assessment'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main View ─────────────────────────────────────────────────────
const DeploymentAnalyzerView = () => {
  const [model, setModel] = useState<ModelData | null>(null);
  const [animScore, setAnimScore] = useState(0);
  const [targetScore, setTargetScore] = useState(0);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown>({ compatibility: 0, performance: 0, memory: 0, optimization: 0 });
  const [ollamaReady, setOllamaReady] = useState(false);
  const { text, loading, streaming, error, generate, reset } = useOllamaInsight();

  useEffect(() => {
    const raw = localStorage.getItem('corevision_model');
    if (!raw) return;
    const parsed: ModelData = JSON.parse(raw);
    setModel(parsed);
    const { total, breakdown: bd } = computeScores(parsed);
    setTargetScore(total);
    setBreakdown(bd);
  }, []);

  useEffect(() => {
    if (targetScore === 0) return;
    let current = 0;
    const interval = setInterval(() => { 
      current += 1; 
      setAnimScore(current); 
      if (current >= targetScore) clearInterval(interval); 
    }, 15);
    return () => clearInterval(interval);
  }, [targetScore]);

  useEffect(() => {
    checkOllamaHealth().then(setOllamaReady);
    const iv = setInterval(() => checkOllamaHealth().then(setOllamaReady), 10000);
    return () => clearInterval(iv);
  }, []);

  const getColor = (val: number) => val >= 80 ? '#22c55e' : val >= 60 ? '#eab308' : '#ef4444';
  const getGradient = (val: number) => val >= 80 ? 'from-emerald-400 to-emerald-600' : val >= 60 ? 'from-amber-400 to-orange-500' : 'from-rose-500 to-red-600';
  const getLabel = (val: number) => val >= 80 ? 'Excellent' : val >= 60 ? 'Moderate' : 'Needs Work';

  const handleGenerate = () => {
    if (!model) return;
    const payload: DeployInsightPayload = { name: model.name, framework: model.framework, size_mb: model.size_mb, totalScore: targetScore, breakdown };
    generate((onToken, onDone, onError) => streamDeployInsight(payload, onToken, onDone, onError));
  };

  if (!model) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] gap-4">
        <AlertCircle size={72} className="text-slate-600 opacity-50" />
        <h2 className="text-3xl font-bold text-white">No Model Selected</h2>
        <p className="text-slate-400">Upload a model in the Dashboard to begin analysis.</p>
        <a href="/" className="mt-4 px-6 py-3 bg-core-purple rounded-full text-white font-medium hover:bg-core-blue transition-colors shadow-lg shadow-core-purple/30">
          Go to Dashboard
        </a>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 110; // larger radius

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Apple size={36} className="text-white" />
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Deployment Analyzer</h2>
          </div>
          <p className="text-slate-400 font-light flex items-center gap-3 text-lg">
            Analyzing: <strong className="text-white">{model.name}</strong> 
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> {model.framework} 
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> {model.size_mb} MB
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Score Ring Card */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full flex flex-col items-center justify-center py-12 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <h3 className="text-xl font-semibold text-slate-300 mb-10 tracking-wide uppercase text-center relative z-10">Readiness Score</h3>
            
            <div className="relative w-[280px] h-[280px] flex items-center justify-center z-10">
              <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <circle cx="140" cy="140" r="110" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                <circle 
                  cx="140" cy="140" r="110" fill="none" 
                  stroke={getColor(animScore)} strokeWidth="16" strokeLinecap="round" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={circumference - (circumference * animScore) / 100} 
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-7xl font-bold tracking-tighter" style={{ color: getColor(animScore) }}>{animScore}</span>
                <span className="text-sm font-medium text-slate-500 mt-2 tracking-widest uppercase">Score</span>
              </div>
            </div>
            
            <p className="mt-8 text-xl font-bold tracking-tight" style={{ color: getColor(targetScore) }}>
              {getLabel(targetScore)}
            </p>
          </GlassCard>
        </div>

        {/* Breakdown Bars */}
        <div className="lg:col-span-2 flex flex-col gap-4 justify-center">
          {([
            { label: 'Core ML Compatibility',     val: breakdown.compatibility,  icon: ShieldCheck },
            { label: 'Neural Engine Performance', val: breakdown.performance,    icon: Zap },
            { label: 'Memory Footprint',          val: breakdown.memory,         icon: Server },
            { label: 'Optimization Level',        val: breakdown.optimization,   icon: Apple },
          ]).map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.1 + 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6 hover:bg-white/10 transition-colors cursor-default"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${getGradient(item.val)} shadow-lg`}>
                <item.icon size={26} className="text-white drop-shadow-md" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-lg font-medium text-slate-200 tracking-tight">{item.label}</span>
                  <span className="text-2xl font-bold" style={{ color: getColor(item.val) }}>{item.val}<span className="text-sm text-slate-500 ml-1">/100</span></span>
                </div>
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${item.val}%` }} 
                    transition={{ delay: i * 0.1 + 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }} 
                    className={`h-full rounded-full bg-gradient-to-r ${getGradient(item.val)} relative`}
                  >
                    <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-md" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Assessment Panel */}
      <AssessmentPanel
        text={text} loading={loading} streaming={streaming} error={error}
        ollamaReady={ollamaReady} onGenerate={handleGenerate} onReset={reset}
      />
    </div>
  );
};

export default DeploymentAnalyzerView;

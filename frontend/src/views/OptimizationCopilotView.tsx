import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, ArrowRight, AlertCircle, Sparkles, RefreshCw, WifiOff, Activity, Cpu, HardDrive } from 'lucide-react';
import { useOllamaInsight } from '../hooks/useOllamaInsight';
import { streamCopilotInsight, checkOllamaHealth } from '../services/insightService';
import { GlassCard } from '../components/GlassCard';
import MarkdownRenderer from '../components/MarkdownRenderer';

// Local type — mirrors CopilotInsightPayload from insightService
interface CopilotInsightPayload {
  name: string;
  framework: string;
  size_mb: number;
  baseStats: { fps: number; latency: number; memory: number; size: number };
  simStats:  { fps: number; latency: number; memory: number; size: number };
  opts: { quantize: boolean; coreml: boolean; resize: boolean };
}

interface ModelData { name: string; framework: string; size_mb: number; }
interface Stats { fps: number; memory: number; latency: number; size: number; }

const computeBaseline = (model: ModelData): Stats => {
  let fps = model.framework === 'CoreML' ? 28 : model.framework === 'ONNX' ? 22 : 15;
  let latency = model.framework === 'CoreML' ? 36 : model.framework === 'ONNX' ? 48 : 65;
  const memory = Math.round(model.size_mb * 12 + 150);
  const raw = localStorage.getItem('corevision_inference_stats');
  if (raw) {
    const p = JSON.parse(raw);
    if (p.fps > 0) fps = p.fps;
    if (p.latency > 0) latency = p.latency;
  }
  return { fps, latency, memory, size: model.size_mb };
};

const applyOptimizations = (base: Stats, opts: { quantize: boolean; coreml: boolean; resize: boolean }): Stats => {
  let { fps, latency, memory, size } = { ...base };
  if (opts.quantize) { 
    size = Number((size * 0.25).toFixed(2)); 
    memory = Math.round(memory * 0.45); 
    fps += Math.round(fps * 0.3); 
    latency = Math.round(latency * 0.7); 
  }
  if (opts.coreml) { 
    fps += Math.round(fps * 0.4); 
    latency = Math.round(latency * 0.6); 
    // CoreML models often have a slight metadata overhead
    size = Number((size * 1.05).toFixed(2));
    memory = Math.round(memory * 0.9); // ANE manages memory more efficiently
  }
  if (opts.resize) { 
    fps += Math.round(fps * 0.2); 
    latency = Math.round(latency * 0.8); 
    memory = Math.round(memory * 0.75); 
  }
  return { fps: Math.min(120, fps), latency: Math.max(4, latency), memory: Math.max(50, memory), size };
};

const TOGGLE_INFO: Record<string, { effect: string; tradeoff: string }> = {
  quantize: {
    effect: 'Compresses weights FP32 → INT8, shrinking the model ~4× and boosting throughput ~30%.',
    tradeoff: 'Minor accuracy drop (~0.5–1%) on fine-grained tasks. Usually negligible for detection.',
  },
  coreml: {
    effect: 'Converts model to CoreML so Apple Neural Engine (ANE) handles inference — massive latency cut.',
    tradeoff: 'Requires macOS/iOS deployment. Incompatible with non-Apple hardware.',
  },
  resize: {
    effect: 'Halves input resolution (640 → 320 px), reducing FLOPs quadratically — a quick speed win.',
    tradeoff: 'Smaller objects and fine details may be missed. Best for latency-critical scenarios.',
  },
};

const Toggle = ({ id, label, desc, checked, onChange }: { id: string; label: string; desc: string; checked: boolean; onChange: () => void }) => (
  <div 
    onClick={onChange} 
    className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${
      checked 
        ? 'bg-core-purple/10 border-core-purple/50 shadow-[0_0_20px_rgba(109,93,251,0.15)]' 
        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
    }`}
  >
    <div className="flex justify-between items-center">
      <div>
        <div className={`font-semibold text-lg ${checked ? 'text-white' : 'text-slate-200'}`}>{label}</div>
        <div className="text-sm text-slate-400 mt-1">{desc}</div>
      </div>
      
      {/* Custom Switch UI */}
      <div className={`w-12 h-6 rounded-full relative shrink-0 transition-colors duration-300 ml-4 ${checked ? 'bg-core-purple shadow-[0_0_10px_rgba(109,93,251,0.5)]' : 'bg-white/20'}`}>
        <motion.div 
          layout 
          className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
          initial={false}
          animate={{ left: checked ? '26px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }} 
        />
      </div>
    </div>
    
    <AnimatePresence>
      {checked && (
        <motion.div 
          initial={{ opacity: 0, height: 0, marginTop: 0 }} 
          animate={{ opacity: 1, height: 'auto', marginTop: 16 }} 
          exit={{ opacity: 0, height: 0, marginTop: 0 }} 
          className="overflow-hidden"
        >
          <div className="p-4 bg-core-purple/10 rounded-xl border-l-4 border-core-purple">
            <p className="text-sm text-core-cyan mb-2 leading-relaxed"><strong className="text-white">Effect:</strong> {TOGGLE_INFO[id]?.effect}</p>
            <p className="text-sm text-slate-400 leading-relaxed"><strong className="text-slate-300">Trade-off:</strong> {TOGGLE_INFO[id]?.tradeoff}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const StatRow = ({ label, before, after, unit, higher, icon: Icon }: { label: string; before: number; after: number; unit: string; higher: boolean; icon: any }) => {
  const changed = before !== after;
  const improved = higher ? after > before : after < before;
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center gap-3 mb-2 sm:mb-0 w-full sm:w-auto">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-slate-300" />
        </div>
        <span className="text-slate-300 font-medium tracking-wide">{label}</span>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-400">{before}</span>
          <span className="text-sm text-slate-500">{unit}</span>
        </div>
        
        <ArrowRight size={20} className={changed ? (improved ? 'text-core-green' : 'text-rose-500') : 'text-slate-600'} />
        
        <div className="flex items-baseline gap-1 relative min-w-[80px]">
          <AnimatePresence mode="wait">
            <motion.span 
              key={after} 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }} 
              className={`text-2xl font-extrabold ${changed ? (improved ? 'text-core-green drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]') : 'text-white'}`}
            >
              {after}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-slate-400">{unit}</span>
        </div>
        
        {changed && (
          <span className={`w-16 text-right text-sm font-bold ${improved ? 'text-core-green' : 'text-rose-500'}`}>
            {improved ? '▲' : '▼'} {Math.abs(Math.round(((after - before) / before) * 100))}%
          </span>
        )}
        {!changed && <span className="w-16" />}
      </div>
    </div>
  );
};

const InsightPanel = ({ text, loading, streaming, error, ollamaReady, onGenerate, onReset }: {
  text: string; loading: boolean; streaming: boolean; error: string | null;
  ollamaReady: boolean; onGenerate: () => void; onReset: () => void;
}) => {
  const hasContent = text.length > 0;
  const isActive = loading || streaming;
  
  return (
    <div className="mt-auto p-6 bg-gradient-to-br from-core-purple/10 to-transparent rounded-2xl border border-core-purple/30 flex flex-col gap-4 relative overflow-hidden group">
      {/* Neural Background effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-core-purple/20 blur-[40px] rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-core-purple/20 flex items-center justify-center">
            <Sparkles size={16} className="text-core-purple" />
          </div>
          <strong className="text-lg text-core-purple">Llama 3.2 Copilot</strong>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${ollamaReady ? 'bg-core-green/10 text-core-green border-core-green/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
            {ollamaReady ? 'Local' : 'Offline'}
          </span>
        </div>
        {hasContent && !isActive && (
          <button onClick={onReset} className="text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {!ollamaReady && !hasContent && !isActive && (
        <div className="flex items-center gap-2 text-sm text-rose-400">
          <WifiOff size={14} />
          Start Ollama with <code className="bg-white/10 px-2 py-0.5 rounded font-mono ml-1 text-rose-300">ollama serve</code>
        </div>
      )}

      {error && <p className="text-sm text-rose-400">⚠ {error}</p>}

      {loading && !streaming && (
        <div className="flex gap-2 items-center mt-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div 
                key={i} 
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }} 
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} 
                className="w-2 h-2 rounded-full bg-core-purple" 
              />
            ))}
          </div>
          <span className="text-sm text-slate-400 ml-2">Analyzing configuration...</span>
        </div>
      )}

      {hasContent && (
        <div className="text-sm mt-2 relative z-10">
          <MarkdownRenderer
            text={text}
            streaming={streaming}
            streamingColor="bg-core-purple"
          />
        </div>
      )}

      {!hasContent && !isActive && !error && (
        <p className="text-sm text-slate-400">Toggle optimizations then ask Llama for tailored advice on the resulting performance.</p>
      )}

      {!isActive && (
        <button 
          className={`mt-2 self-start flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold transition-all ${
            ollamaReady 
              ? 'bg-core-purple text-white hover:bg-[#5e4ee8] shadow-[0_4px_14px_rgba(109,93,251,0.4)]' 
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
          onClick={onGenerate} 
          disabled={!ollamaReady}
        >
          <Sparkles size={16} />{hasContent ? 'Regenerate Insight' : 'Generate AI Insight'}
        </button>
      )}
    </div>
  );
};

// ─── Main View ─────────────────────────────────────────────────────
const OptimizationCopilotView = () => {
  const [model, setModel] = useState<ModelData | null>(null);
  const [baseStats, setBaseStats] = useState<Stats>({ fps: 0, latency: 0, memory: 0, size: 0 });
  const [opts, setOpts] = useState({ quantize: false, coreml: false, resize: false });
  const [saved, setSaved] = useState(false);
  const [ollamaReady, setOllamaReady] = useState(false);
  const { text, loading, streaming, error, generate, reset } = useOllamaInsight();

  useEffect(() => {
    const loadModel = () => {
      const raw = localStorage.getItem('corevision_model');
      if (!raw) return;
      const parsed: ModelData = JSON.parse(raw);
      setModel(parsed);
      setBaseStats(computeBaseline(parsed));
    };

    loadModel(); // Initial load
    
    // Listen for changes in other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'corevision_model') {
        loadModel();
      }
    };
    
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    checkOllamaHealth().then(setOllamaReady);
    const iv = setInterval(() => checkOllamaHealth().then(setOllamaReady), 10000);
    return () => clearInterval(iv);
  }, []);

  const simStats = applyOptimizations(baseStats, opts);

  const handleGenerate = () => {
    if (!model) return;
    const payload: CopilotInsightPayload = { name: model.name, framework: model.framework, size_mb: model.size_mb, baseStats, simStats, opts };
    generate((onToken, onDone, onError) => streamCopilotInsight(payload, onToken, onDone, onError));
  };

  const saveForReport = () => {
    localStorage.setItem('corevision_opt_stats', JSON.stringify({ baseStats, simStats, opts }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Wand2 size={36} className="text-core-cyan drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Optimization Copilot</h2>
          </div>
          <p className="text-slate-400 font-light flex items-center gap-3 text-lg">
            Simulating: <strong className="text-white">{model.name}</strong> 
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> {model.framework} 
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> {model.size_mb} MB
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Toggles and Llama */}
        <div className="flex flex-col gap-6">
          <GlassCard className="flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Strategies</h3>
            
            <Toggle id="quantize" label="INT8 Quantization" desc="Convert FP32 weights → INT8. ~4× smaller, ~30% faster." checked={opts.quantize} onChange={() => setOpts(o => ({ ...o, quantize: !o.quantize }))} />
            <Toggle id="coreml"   label="CoreML Conversion (ANE)" desc="Enables Apple Neural Engine execution for maximum throughput." checked={opts.coreml} onChange={() => setOpts(o => ({ ...o, coreml: !o.coreml }))} />
            <Toggle id="resize"   label="Input Resize (640 → 320)" desc="Halve input resolution. Reduces FLOPs significantly." checked={opts.resize} onChange={() => setOpts(o => ({ ...o, resize: !o.resize }))} />
          </GlassCard>

          <InsightPanel text={text} loading={loading} streaming={streaming} error={error} ollamaReady={ollamaReady} onGenerate={handleGenerate} onReset={reset} />
        </div>

        {/* Right Column: Sim Results */}
        <div className="flex flex-col h-full">
          <GlassCard className="flex flex-col gap-6 flex-1 relative overflow-hidden group">
            {/* Ambient Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-core-cyan/5 via-core-purple/5 to-transparent blur-3xl pointer-events-none" />
            
            <h3 className="text-2xl font-bold text-white tracking-tight relative z-10">Simulation Results</h3>
            
            <div className="flex flex-col gap-3 relative z-10">
              <StatRow label="Inference FPS" before={baseStats.fps} after={simStats.fps} unit=""     higher={true} icon={Activity} />
              <StatRow label="Memory"        before={baseStats.memory} after={simStats.memory} unit=" MB" higher={false} icon={HardDrive} />
              <StatRow label="Latency"       before={baseStats.latency} after={simStats.latency} unit=" ms" higher={false} icon={Activity} />
              <StatRow label="Disk Size"     before={baseStats.size} after={simStats.size} unit=" MB" higher={false} icon={Cpu} />
            </div>

            <AnimatePresence>
              {(opts.quantize || opts.coreml || opts.resize) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-core-green/10 border border-core-green/30 rounded-xl flex flex-wrap gap-2 items-center relative z-10"
                >
                  <span className="text-core-green font-bold text-sm tracking-wide uppercase mr-2">Active Config:</span>
                  {[
                    opts.quantize && <span key="q" className="px-2 py-1 bg-core-green/20 text-core-green rounded text-xs font-semibold">INT8</span>,
                    opts.coreml && <span key="c" className="px-2 py-1 bg-core-green/20 text-core-green rounded text-xs font-semibold">CoreML</span>,
                    opts.resize && <span key="r" className="px-2 py-1 bg-core-green/20 text-core-green rounded text-xs font-semibold">Resize</span>
                  ].filter(Boolean)}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              className={`mt-auto w-full py-4 rounded-xl font-bold text-lg transition-all relative z-10 overflow-hidden flex justify-center items-center gap-2 ${
                saved 
                  ? 'bg-core-green text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                  : 'bg-white text-black hover:bg-slate-200 hover:scale-[1.02] shadow-xl'
              }`}
              onClick={saveForReport}
            >
              {saved ? '✓ Saved for Report' : 'Save Results for Report'}
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default OptimizationCopilotView;

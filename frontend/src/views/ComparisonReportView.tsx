import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Download, CheckCircle, FileText, RefreshCw, AlertCircle, ArrowUp, ArrowDown, MoveRight } from 'lucide-react';
import jsPDF from 'jspdf';
import { GlassCard } from '../components/GlassCard';

interface Stats { fps: number; memory: number; latency: number; size: number; }
interface OptData { baseStats: Stats; simStats: Stats; opts: { quantize: boolean; coreml: boolean; resize: boolean }; }
interface ReportData { model: { name: string; framework: string; size_mb: number }; opt: OptData; }

const ComparisonReportView = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const loadData = useCallback(() => {
    const modelRaw = localStorage.getItem('corevision_model');
    const optRaw = localStorage.getItem('corevision_opt_stats');
    if (modelRaw && optRaw) {
      setReportData({
        model: JSON.parse(modelRaw),
        opt: JSON.parse(optRaw)
      });
    } else {
      setReportData(null);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadData();
    // Also listen for localStorage writes from other tabs / components
    const handler = (e: StorageEvent) => {
      if (e.key === 'corevision_opt_stats') loadData();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadData]);

  // Real export: generate a pdf report and trigger browser download
  const handleExport = () => {
    if (!reportData) return;
    setIsExporting(true);

    const { model, opt } = reportData;
    const { baseStats, simStats, opts } = opt;
    const optList: string[] = [];
    if (opts.quantize) optList.push('INT8 Quantization');
    if (opts.coreml) optList.push('CoreML Conversion (ANE)');
    if (opts.resize) optList.push('Input Resize (640 -> 320)');

    const now = new Date().toLocaleString();
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('CoreVision Studio - Analysis Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${now}`, 20, 30);
    
    // Section 1: Model Summary
    doc.setFontSize(14);
    doc.text('1. MODEL SUMMARY', 20, 45);
    doc.setFontSize(12);
    doc.text(`Name: ${model.name}`, 25, 55);
    doc.text(`Framework: ${model.framework}`, 25, 65);
    doc.text(`Size: ${model.size_mb} MB`, 25, 75);
    
    // Section 2: Optimizations Applied
    doc.setFontSize(14);
    doc.text('2. OPTIMIZATIONS APPLIED', 20, 90);
    doc.setFontSize(12);
    if (optList.length === 0) {
      doc.text('None', 25, 100);
    } else {
      optList.forEach((item, index) => {
        doc.text(`- ${item}`, 25, 100 + (index * 10));
      });
    }
    
    const tableStartY = optList.length === 0 ? 120 : 100 + (optList.length * 10) + 15;
    
    // Section 3: Performance Comparison
    doc.setFontSize(14);
    doc.text('3. PERFORMANCE COMPARISON', 20, tableStartY);
    doc.setFontSize(12);
    
    let currentY = tableStartY + 10;
    
    doc.text('Metric', 25, currentY);
    doc.text('Baseline', 80, currentY);
    doc.text('Optimized', 140, currentY);
    currentY += 10;
    
    doc.text('Inference FPS', 25, currentY);
    doc.text(`${baseStats.fps}`, 80, currentY);
    doc.text(`${simStats.fps}`, 140, currentY);
    currentY += 10;

    doc.text('Memory (MB)', 25, currentY);
    doc.text(`${baseStats.memory}`, 80, currentY);
    doc.text(`${simStats.memory}`, 140, currentY);
    currentY += 10;
    
    doc.text('Latency (ms)', 25, currentY);
    doc.text(`${baseStats.latency}`, 80, currentY);
    doc.text(`${simStats.latency}`, 140, currentY);
    currentY += 10;
    
    doc.text('Disk Size (MB)', 25, currentY);
    doc.text(`${baseStats.size}`, 80, currentY);
    doc.text(`${simStats.size}`, 140, currentY);
    currentY += 20;
    
    // Section 4
    doc.setFontSize(14);
    doc.text('4. APPLE SILICON READINESS', 20, currentY);
    doc.setFontSize(12);
    currentY += 10;
    const fwText = model.framework === 'CoreML' ? 'is natively CoreML compatible.' : model.framework === 'ONNX' ? 'requires CoreML conversion for ANE.' : 'requires conversion to CoreML/ONNX.';
    doc.text(`Framework ${fwText}`, 25, currentY);
    currentY += 10;
    doc.text('Recommended deployment target: Apple Neural Engine via CoreML.', 25, currentY);
    
    doc.save(`corevision_report_${model.name.replace(/\./g, '_')}.pdf`);

    setTimeout(() => {
      setIsExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 800);
  };

  const MetricRow = ({
    label, before, after, unit, better
  }: { label: string; before: number; after: number; unit: string; better: 'higher' | 'lower' }) => {
    const changed = before !== after;
    const improved = better === 'higher' ? after > before : after < before;
    const pct = before ? Math.abs(Math.round(((after - before) / before) * 100)) : 0;
    
    return (
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center py-4 px-6 border-b border-white/5 hover:bg-white/5 transition-colors group">
        <span className="text-slate-300 font-medium text-sm md:text-base">{label}</span>
        
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-medium text-slate-400">{before}</span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-bold ${changed ? (improved ? 'text-core-green' : 'text-rose-500') : 'text-white'}`}>
            {after}
          </span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
        
        <div className="flex justify-end">
          {changed ? (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${improved ? 'bg-core-green/10 text-core-green' : 'bg-rose-500/10 text-rose-500'}`}>
              {improved ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              {pct}%
            </div>
          ) : (
            <span className="text-slate-600 text-sm font-medium">—</span>
          )}
        </div>
      </div>
    );
  };

  // No data state
  if (!reportData) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-core-blue/20 blur-[50px] rounded-full" />
          <AlertCircle size={80} className="text-slate-600 relative z-10 opacity-50" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">No Report Available</h2>
        <p className="text-slate-400 text-center max-w-md text-lg font-light leading-relaxed">
          Go to <strong className="text-white">Optimization Copilot</strong>, toggle your desired optimizations, and click <strong className="text-white">Save Results for Report</strong> to generate data.
        </p>
        <div className="flex gap-4 mt-4">
          <a href="/" className="px-6 py-3 bg-core-blue rounded-full text-white font-semibold hover:bg-[#4a7aeb] transition-colors shadow-lg shadow-core-blue/30">
            Go to Dashboard
          </a>
          <button 
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium flex items-center gap-2 transition-colors border border-white/10"
            onClick={loadData}
          >
            <RefreshCw size={18} /> Refresh Data
          </button>
        </div>
      </div>
    );
  }

  const { model, opt } = reportData;
  const { baseStats, simStats, opts } = opt;
  const optList: string[] = [];
  if (opts.quantize) optList.push('INT8 Quantization');
  if (opts.coreml) optList.push('CoreML Conversion (ANE)');
  if (opts.resize) optList.push('Input Resize (640 → 320)');

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <GitCompare size={36} className="text-core-cyan" />
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Comparison Report</h2>
          </div>
          <p className="text-slate-400 font-light flex items-center gap-3 text-lg">
            Final Analysis: <strong className="text-white">{model.name}</strong>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-colors flex items-center gap-2 font-medium"
          >
            <RefreshCw size={16} /> Refresh
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg min-w-[200px] justify-center ${
              exported 
                ? 'bg-core-green text-white shadow-core-green/30' 
                : 'bg-gradient-to-r from-core-blue to-core-purple text-white hover:opacity-90 shadow-core-purple/30'
            }`}
          >
            {isExporting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw size={18} />
              </motion.div>
            ) : exported ? (
              <><CheckCircle size={18} /> Download Complete!</>
            ) : (
              <><Download size={18} /> Export PDF Report</>
            )}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        
        {/* Before vs After Table */}
        <GlassCard className="flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-white/10 to-transparent border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight">Before vs After</h3>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-white/10 rounded-full text-slate-300">
              <span className="w-2 h-2 rounded-full bg-core-blue" /> Baseline 
              <MoveRight size={12} className="mx-1 opacity-50" />
              <span className="w-2 h-2 rounded-full bg-core-purple" /> Optimized
            </div>
          </div>
          
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] px-6 py-3 bg-black/40 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
            <span>Metric</span>
            <span>Baseline</span>
            <span>Optimized</span>
            <span className="text-right">Change</span>
          </div>
          
          <div className="flex flex-col">
            <MetricRow label="Inference FPS"  before={baseStats.fps}     after={simStats.fps}     unit=""     better="higher" />
            <MetricRow label="Memory Usage"   before={baseStats.memory}  after={simStats.memory}  unit=" MB"  better="lower"  />
            <MetricRow label="Latency"        before={baseStats.latency} after={simStats.latency} unit=" ms"  better="lower"  />
            <MetricRow label="Disk Size"      before={baseStats.size}    after={simStats.size}    unit=" MB"  better="lower"  />
          </div>
        </GlassCard>

        {/* Report Preview */}
        <div className="relative group">
          {/* Glowing backdrop for the document */}
          <div className="absolute -inset-1 bg-gradient-to-br from-core-blue/20 via-core-purple/20 to-core-cyan/20 rounded-[28px] blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-white text-slate-900 rounded-[24px] overflow-hidden shadow-2xl">
            {/* Top accent bar */}
            <div className="h-2 w-full bg-gradient-to-r from-core-blue via-core-purple to-core-cyan" />
            
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-start mb-8 border-b-2 border-slate-100 pb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">CoreVision Report</h2>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <FileText size={28} className="text-indigo-600" />
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-slate-300" /> 1. Model Summary
                  </h4>
                  <p className="text-slate-700 leading-relaxed text-[15px]">
                    Analyzed <strong className="text-slate-900 font-semibold">{model.name}</strong>. Framework: {model.framework}. Original size: {model.size_mb} MB.
                  </p>
                </section>

                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-slate-300" /> 2. Optimizations Applied
                  </h4>
                  {optList.length ? (
                    <ul className="space-y-2 text-[15px] text-slate-700">
                      {optList.map((s, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[15px] text-slate-500 italic">No optimizations selected.</p>
                  )}
                </section>

                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-slate-300" /> 3. Key Result
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[15px] text-slate-800 leading-relaxed font-medium">
                      {simStats.fps > baseStats.fps
                        ? `Throughput improved from ${baseStats.fps} FPS to ${simStats.fps} FPS (+${Math.round(((simStats.fps - baseStats.fps) / baseStats.fps) * 100)}%).`
                        : 'No throughput improvement selected.'}
                      {simStats.memory < baseStats.memory
                        ? ` Memory footprint reduced from ${baseStats.memory} MB to ${simStats.memory} MB.`
                        : ''}
                    </p>
                  </div>
                </section>
              </div>
              
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium">
                <span>Generated by CoreVision Studio</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ComparisonReportView;

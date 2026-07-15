import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import EmptyState from '../components/EmptyState';

const ProfilerView = () => {
  const [hasModel, setHasModel] = useState<boolean | null>(null);
  const [cpuMem, setCpuMem] = useState({ cpu: 0, memory: 0 });
  const [inferenceStats, setInferenceStats] = useState({ fps: 0, latency: 0 });
  const [chartData, setChartData] = useState<{ time: string; cpu: number; memory: number }[]>([]);
  const [wsReady, setWsReady] = useState(false);

  // Check if a model is loaded
  useEffect(() => {
    const raw = localStorage.getItem('corevision_model');
    setHasModel(!!raw);
  }, []);

  // WebSocket for CPU / Memory telemetry
  useEffect(() => {
    let ws: WebSocket;
    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/api/profile/stream');
      ws.onopen = () => setWsReady(true);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const now = new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' });
        const cpu = Math.round(data.cpu_usage_percent);
        const memory = Math.round(data.memory_used_mb);
        setCpuMem({ cpu, memory });
        setChartData(prev => {
          const next = [...prev, { time: now, cpu, memory }];
          return next.length > 30 ? next.slice(-30) : next;
        });
      };
      ws.onclose = () => { setWsReady(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => ws?.close();
  }, []);

  // Poll localStorage for FPS / Latency written by Vision Playground
  useEffect(() => {
    const poll = () => {
      const raw = localStorage.getItem('corevision_inference_stats');
      if (raw) {
        const { fps, latency } = JSON.parse(raw);
        setInferenceStats({ fps: fps ?? 0, latency: latency ?? 0 });
      }
    };
    poll(); // immediate
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, []);

  if (hasModel === null) return null;
  if (hasModel === false) {
    return (
      <EmptyState
        title="No Model Uploaded"
        description="Upload a model from the Dashboard to start profiling real-time hardware telemetry."
      />
    );
  }

  const MetricCard = ({
    title, value, unit, icon: Icon, color, sub, trend
  }: { title: string; value: number | string; unit: string; icon: React.ElementType; color: string; sub?: string; trend?: string }) => (
    <GlassCard className="flex flex-col gap-3 relative overflow-hidden group" hoverEffect={false}>
      {/* Background glow matching the metric color */}
      <div 
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider relative z-10">
        <Icon size={16} style={{ color }} /> {title}
      </div>
      
      <div className="flex items-baseline gap-2 relative z-10">
        <span className="text-4xl font-bold text-white tracking-tight">
          {value === 0 ? '—' : value}
        </span>
        {value !== 0 && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
        
        {trend && (
          <span className="ml-auto text-xs font-medium text-core-green bg-core-green/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            ↑ {trend}
          </span>
        )}
      </div>
      
      {sub && <div className="text-xs text-slate-500 font-medium mt-auto relative z-10">{sub}</div>}
    </GlassCard>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6 pb-20">
      <header className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-4xl font-extrabold mb-1 text-white tracking-tight">Performance Profiler</h2>
          <p className="text-slate-400 font-light flex items-center gap-2">
            Real-time hardware telemetry & inference metrics
            {!wsReady && <span className="text-rose-500 text-xs font-medium px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20">Backend Offline</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {['1m', '5m', '15m', '1h'].map(t => (
            <button key={t} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${t === '1m' ? 'bg-core-blue text-white shadow-[0_0_10px_rgba(91,140,255,0.5)]' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard title="FPS"     value={inferenceStats.fps || 0}    unit=""   icon={Activity}  color="#22D3EE" sub="Vision Playground" />
        <MetricCard title="Latency" value={inferenceStats.latency || 0} unit="ms" icon={Clock}     color="#5B8CFF" sub="Vision Playground" />
        <MetricCard title="CPU"     value={cpuMem.cpu || 0}             unit="%"   icon={Cpu}       color="#6D5DFB" sub={wsReady ? 'Live via psutil' : 'Awaiting backend'} />
        <MetricCard title="Memory"  value={cpuMem.memory ? (cpuMem.memory / 1024).toFixed(2) : 0} unit="GB" icon={HardDrive} color="#A855F7" sub={wsReady ? 'Live via psutil' : 'Awaiting backend'} />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 gap-6 flex-1">
        
        {/* Main CPU/Memory Area Chart */}
        <GlassCard className="flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">CPU & Memory (Live Window)</h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1 text-core-blue"><div className="w-2 h-2 rounded-full bg-core-blue shadow-[0_0_8px_#5B8CFF]" /> CPU (%)</div>
              <div className="flex items-center gap-1 text-core-violet"><div className="w-2 h-2 rounded-full bg-core-violet shadow-[0_0_8px_#A855F7]" /> Memory (MB)</div>
              <div className={`flex items-center gap-1 ml-4 px-2 py-1 rounded-md ${wsReady ? 'bg-core-green/10 text-core-green' : 'bg-rose-500/10 text-rose-500'}`}>
                <div className={`w-2 h-2 rounded-full ${wsReady ? 'bg-core-green animate-pulse' : 'bg-rose-500'}`} />
                {wsReady ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            {chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                {wsReady ? 'Collecting telemetry...' : 'Backend offline. Showing dummy data...'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B8CFF" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#5B8CFF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} tickMargin={10} minTickGap={30} />
                  <YAxis yAxisId="cpu" stroke="transparent" tick={{ fill: '#5B8CFF', fontSize: 11 }} domain={[0, 100]} />
                  <YAxis yAxisId="mem" orientation="right" stroke="transparent" tick={{ fill: '#A855F7', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(7,11,23,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', color: '#fff' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                  />
                  <Area yAxisId="cpu" type="monotone" dataKey="cpu" name="CPU (%)" stroke="#5B8CFF" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                  <Area yAxisId="mem" type="monotone" dataKey="memory" name="Memory (MB)" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorMem)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProfilerView;

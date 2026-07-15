import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Layers, CheckCircle, XCircle, Database, Cpu, HardDrive } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import EmptyState from '../components/EmptyState';

/** Derive layer breakdown percentages from real layer list or framework */
function computeLayerBreakdown(layers: any[], framework: string) {
  if (layers.length > 0) {
    const counts: Record<string, number> = {};
    layers.forEach((l) => {
      const t = l.type || 'Other';
      counts[t] = (counts[t] || 0) + 1;
    });
    const total = layers.length;
    const colors = ['#6D5DFB', '#5B8CFF', '#22D3EE', '#A855F7', '#22C55E'];
    return Object.entries(counts).map(([name, count], i) => ({
      name,
      value: Math.round((count / total) * 100 * 10) / 10,
      color: colors[i % colors.length],
    }));
  }
  // Framework-based estimates if layer detail not available
  if (framework === 'CoreML') {
    return [
      { name: 'Neural Engine', value: 62, color: '#6D5DFB' },
      { name: 'Conv/BN', value: 25, color: '#5B8CFF' },
      { name: 'Activation', value: 8, color: '#22D3EE' },
      { name: 'Other', value: 5, color: '#A855F7' },
    ];
  }
  if (framework === 'ONNX') {
    return [
      { name: 'Convolutional', value: 48, color: '#6D5DFB' },
      { name: 'Normalization', value: 28, color: '#5B8CFF' },
      { name: 'Activation', value: 14, color: '#22D3EE' },
      { name: 'Other', value: 10, color: '#A855F7' },
    ];
  }
  // PyTorch default
  return [
    { name: 'Convolutional', value: 54, color: '#6D5DFB' },
    { name: 'Normalization', value: 24, color: '#5B8CFF' },
    { name: 'Activation', value: 8, color: '#22D3EE' },
    { name: 'Other', value: 14, color: '#A855F7' },
  ];
}

/** Derive utilization estimates from framework + model size */
function computeUtilization(framework: string, size_mb: number) {
  const isSmall = size_mb <= 10;
  const isMedium = size_mb <= 50;

  if (framework === 'CoreML') {
    return [
      { label: 'Neural Engine', value: isSmall ? 90 : isMedium ? 82 : 70, color: 'bg-core-purple' },
      { label: 'GPU', value: isSmall ? 15 : isMedium ? 30 : 48, color: 'bg-core-blue' },
      { label: 'CPU', value: isSmall ? 8 : 15, color: 'bg-core-cyan' },
      { label: 'Memory', value: Math.min(95, Math.round(size_mb * 1.5 + 10)), color: 'bg-core-green' },
    ];
  }
  if (framework === 'ONNX') {
    return [
      { label: 'Neural Engine', value: isSmall ? 45 : 30, color: 'bg-core-purple' },
      { label: 'GPU', value: isSmall ? 60 : isMedium ? 70 : 80, color: 'bg-core-blue' },
      { label: 'CPU', value: isSmall ? 25 : 35, color: 'bg-core-cyan' },
      { label: 'Memory', value: Math.min(95, Math.round(size_mb * 1.2 + 15)), color: 'bg-core-green' },
    ];
  }
  // PyTorch
  return [
    { label: 'Neural Engine', value: isSmall ? 30 : 18, color: 'bg-core-purple' },
    { label: 'GPU', value: isSmall ? 55 : isMedium ? 65 : 75, color: 'bg-core-blue' },
    { label: 'CPU', value: isSmall ? 30 : 40, color: 'bg-core-cyan' },
    { label: 'Memory', value: Math.min(95, Math.round(size_mb * 1.1 + 20)), color: 'bg-core-green' },
  ];
}

/** Derive Apple Silicon compatibility from framework */
function computeCompatibility(framework: string) {
  if (framework === 'CoreML') {
    return [
      { name: 'Core ML', status: 'Native', ok: true },
      { name: 'Neural Engine', status: 'Fully Supported', ok: true },
      { name: 'Metal Performance', status: 'Optimized', ok: true },
      { name: 'GPU Compute', status: 'Supported', ok: true },
    ];
  }
  if (framework === 'ONNX') {
    return [
      { name: 'Core ML', status: 'Via onnxmltools', ok: true },
      { name: 'Neural Engine', status: 'Partial (via CoreML)', ok: true },
      { name: 'Metal Performance', status: 'Supported', ok: true },
      { name: 'GPU Compute', status: 'Supported', ok: true },
    ];
  }
  // PyTorch
  return [
    { name: 'Core ML', status: 'Needs Conversion', ok: false },
    { name: 'Neural Engine', status: 'Not Direct', ok: false },
    { name: 'Metal Performance', status: 'Via MPS Backend', ok: true },
    { name: 'GPU Compute', status: 'MPS Supported', ok: true },
  ];
}

const ModelExplorerView = () => {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [hasModel, setHasModel] = useState<boolean | null>(null);
  const [layerData, setLayerData] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [compatibility, setCompatibility] = useState<any[]>([]);

  useEffect(() => {
    const storedModel = localStorage.getItem('corevision_model');
    if (storedModel) {
      const parsed = JSON.parse(storedModel);
      setHasModel(true);

      const layers = parsed.layers || [];
      const framework = parsed.framework || 'PyTorch';
      const size_mb = parsed.size_mb || 0;

      setLayerData(computeLayerBreakdown(layers, framework));
      setUtilization(computeUtilization(framework, size_mb));
      setCompatibility(computeCompatibility(framework));

      setModelInfo({
        name: parsed.name || 'Unknown Model',
        framework,
        size: `${size_mb} MB`,
        parameters: parsed.parameters || parsed.num_parameters || '—',
        inputShape: Array.isArray(parsed.input_shape)
          ? parsed.input_shape.join(', ')
          : (parsed.input_shape || '—'),
        outputShape: Array.isArray(parsed.output_shape)
          ? parsed.output_shape.join(', ')
          : (parsed.output_shape || '—'),
        precision: parsed.precision || 'FP32',
        totalLayers: parsed.total_layers || layers.length || '—',
        layers: layers.slice(0, 6).map((l: any) => ({
          name: l.name || l.type || 'Layer',
          dims: l.output_shape
            ? (Array.isArray(l.output_shape) ? l.output_shape.join('×') : l.output_shape)
            : (l.dims || ''),
        })),
      });
    } else {
      setHasModel(false);
    }
  }, []);

  if (hasModel === null) return null;
  if (hasModel === false) {
    return (
      <EmptyState
        title="No Model Uploaded"
        description="Upload a model from the Dashboard to explore its architecture, layers, and compatibility."
      />
    );
  }
  if (!modelInfo) return null;

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 pb-20">

      {/* Header */}
      <header className="mb-2">
        <h2 className="text-4xl font-extrabold mb-2 text-white tracking-tight">Model Explorer</h2>
        <p className="text-slate-400">Deep dive into model architecture and compatibility.</p>
      </header>

      {/* Top Meta Data row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Model', value: modelInfo.name, icon: Network },
          { label: 'Framework', value: modelInfo.framework, icon: Database },
          { label: 'Parameters', value: modelInfo.parameters, icon: Layers },
          { label: 'Model Size', value: modelInfo.size, icon: HardDrive },
          { label: 'Precision', value: modelInfo.precision, icon: Cpu },
        ].map((stat, i) => (
          <GlassCard key={i} className="flex flex-col p-5 gap-2 items-start" hoverEffect={false}>
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <stat.icon size={16} className="text-core-purple" />
              {stat.label}
            </div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Architecture Flow */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full">
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Model Graph</h3>
            <div className="flex flex-col items-center py-4 relative">
              <div className="absolute top-8 bottom-8 w-1 bg-gradient-to-b from-core-purple via-core-blue to-core-cyan rounded-full opacity-30 z-0" />
              {modelInfo.layers.length > 0 ? (
                modelInfo.layers.map((layer: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.12 + 0.2 }}
                    className="z-10 bg-[#0F172A] border border-core-purple/30 rounded-xl p-4 w-52 text-center mb-6 shadow-[0_0_15px_rgba(109,93,251,0.2)]"
                  >
                    <div className="font-bold text-white text-sm">{layer.name}</div>
                    {layer.dims && <div className="text-xs text-core-cyan mt-1">{layer.dims}</div>}
                  </motion.div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center mt-8 z-10">
                  Layer details not available for this model format.
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Analytics & Compatibility */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">

            {/* Layer Breakdown */}
            <GlassCard className="flex flex-col">
              <h3 className="text-xl font-bold mb-1 text-white tracking-tight">Layer Breakdown</h3>
              <p className="text-sm text-slate-400 mb-6">
                Total Layers: <span className="text-white font-bold ml-2">{modelInfo.totalLayers}</span>
              </p>

              <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={layerData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {layerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-y-0 right-0 flex flex-col justify-center gap-3">
                  {layerData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="w-20 truncate">{item.name}</span>
                      <span className="font-bold text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Apple Silicon Compatibility */}
            <GlassCard className="flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-core-green/20 blur-[50px] rounded-full pointer-events-none" />
              <h3 className="text-xl font-bold mb-6 text-white tracking-tight relative z-10">Apple Silicon Compatibility</h3>

              <div className="flex flex-col gap-4 relative z-10">
                {compatibility.map((comp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5"
                  >
                    {comp.ok
                      ? <CheckCircle size={22} className="text-core-green shrink-0" />
                      : <XCircle size={22} className="text-amber-400 shrink-0" />}
                    <div>
                      <div className="font-bold text-white text-sm">{comp.name}</div>
                      <div className={`text-xs ${comp.ok ? 'text-core-green' : 'text-amber-400'}`}>{comp.status}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Estimated Utilization */}
          <GlassCard>
            <h3 className="text-xl font-bold mb-1 text-white tracking-tight">Estimated Utilization</h3>
            <p className="text-xs text-slate-500 mb-5">Based on framework ({modelInfo.framework}) and model size ({modelInfo.size})</p>
            <div className="flex flex-col gap-5">
              {utilization.map((stat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-slate-400 font-medium shrink-0">{stat.label}</div>
                  <div className="flex-1 bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${stat.color} shadow-[0_0_10px_currentColor]`}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 + 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="w-10 text-right text-sm font-bold text-white shrink-0">{stat.value}%</div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
};

export default ModelExplorerView;

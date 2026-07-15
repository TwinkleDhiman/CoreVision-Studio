import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileBox, ChevronRight, Zap, Target, FileOutput } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { MetricCard } from '../components/MetricCard';

const DashboardView = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelData, setModelData] = useState<any>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('corevision_model');
    if (saved) {
      try {
        setModelData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      setUploadProgress(80);
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('corevision_model', JSON.stringify(data));
        // Clear stale stats from previous models so Copilot and Profiler reset
        localStorage.removeItem('corevision_inference_stats');
        localStorage.removeItem('corevision_opt_stats');
        setModelData(data);
        setUploadProgress(100);
        setTimeout(() => navigate('/explorer'), 500);
      } else {
        alert("Upload failed. Make sure backend is running.");
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to backend.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 pb-20">
      
      {/* Hero Welcome Card */}
      <GlassCard className="text-center py-16 relative overflow-hidden group">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block mb-6 relative"
        >
          <div className="absolute -inset-4 bg-core-purple/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <img
            src="/corevision_logo.png"
            alt="CoreVision Logo"
            className="w-20 h-20 object-contain rounded-2xl drop-shadow-[0_0_18px_rgba(109,93,251,0.55)] relative z-10"
          />
        </motion.div>

        <h1 className="text-5xl font-extrabold mb-4 text-gradient tracking-tight">
          Welcome to CoreVision Studio
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
          Develop, analyze and optimize computer vision models for Apple Silicon deployment.
        </p>
      </GlassCard>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Dropzone */}
        <div className={modelData ? "lg:col-span-2" : "lg:col-span-3"}>
          <GlassCard 
            className="relative h-full flex flex-col items-center justify-center min-h-[360px] cursor-pointer group overflow-hidden !p-0"
            onClick={triggerUpload}
            hoverEffect={false}
          >
            {/* Animated Pulsing Background */}
            <motion.div 
              className="absolute inset-0 bg-core-purple/10"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
            {/* Dashed Neon Border */}
            <div className="absolute inset-2 rounded-[20px] border-2 border-dashed border-core-cyan/50 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] group-hover:border-core-cyan group-hover:drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] transition-all pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full h-full">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pt,.onnx,.mlmodel,.mlpackage" 
              />
              {isUploading ? (
                <div className="w-full max-w-md text-center">
                  <h3 className="text-xl font-medium mb-4 text-white">Analyzing Model...</h3>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                    <motion.div 
                      className="bg-core-cyan h-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.4 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <motion.div 
                    className="mx-auto w-24 h-24 bg-core-purple/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-core-purple/30 shadow-[0_0_30px_rgba(109,93,251,0.3)]"
                    whileHover={{ y: -5 }}
                  >
                    <Upload size={48} className="text-core-cyan drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2 text-white tracking-tight">Drag & Drop your model here</h2>
                  <p className="text-slate-300 font-light mb-8">Supports .pt, .onnx, .mlmodel, .tflite files</p>
                  <div className="px-8 py-3 rounded-full bg-core-purple/20 text-white font-semibold inline-block border border-core-purple/40 group-hover:bg-core-purple group-hover:shadow-[0_0_20px_rgba(109,93,251,0.6)] transition-all">
                    Browse Files
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Quick Stats Grid - Only show if model exists */}
        {modelData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <MetricCard 
              title="Supported Formats" 
              value="12+" 
              icon={FileBox} 
            />
            <MetricCard 
              title="Optimized Models" 
              value="1" 
              icon={Target} 
            />
            <MetricCard 
              title="Avg. Speedup" 
              value="1.4x" 
              trend={{ value: 'New', positive: true }} 
              icon={Zap} 
            />
            <MetricCard 
              title="Reports Generated" 
              value="1" 
              icon={FileOutput} 
            />
          </div>
        )}
      </div>

      {/* Recent Models - Only show if model exists */}
      {modelData && (
        <div className="mt-4">
          <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Recent Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="flex flex-col gap-4 p-5 cursor-pointer group hover:-translate-y-1 transition-transform" onClick={() => navigate('/explorer')}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-slate-200">{modelData.metadata?.name || 'Uploaded Model'}</h4>
                  <p className="text-xs text-slate-500 mt-1">{modelData.metadata?.format || 'Unknown Format'}</p>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-core-blue transition-colors" />
              </div>
              <div className="flex justify-between items-end mt-2">
                <span className="text-xs text-slate-500">Just now</span>
                <span className="text-xs font-medium text-core-green flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-core-green" />
                  Active
                </span>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Image as ImageIcon, Video, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import EmptyState from '../components/EmptyState';

type Mode = 'webcam' | 'image' | 'video';
type WsStatus = 'connecting' | 'open' | 'closed' | 'error';

const VisionPlaygroundView = () => {
  const [hasModel, setHasModel] = useState<boolean | null>(null);
  const [activeMode, setActiveMode] = useState<Mode>('webcam');
  const [fps, setFps] = useState(0);
  const [processedFrame, setProcessedFrame] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');

  const webcamRef = useRef<Webcam>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const sendTimeRef = useRef(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<Mode>('webcam');

  // Check for uploaded model
  useEffect(() => {
    const raw = localStorage.getItem('corevision_model');
    setHasModel(!!raw);
  }, []);

  // Keep modeRef in sync
  useEffect(() => { modeRef.current = activeMode; }, [activeMode]);

  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    setWsStatus('connecting');

    const ws = new WebSocket('ws://localhost:8000/api/inference/stream');
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('open');

    ws.onmessage = (event) => {
      setProcessedFrame(event.data);
      const roundtrip = Date.now() - sendTimeRef.current;
      frameCountRef.current += 1;
      const now = Date.now();
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        localStorage.setItem('corevision_inference_stats', JSON.stringify({ fps: currentFps, latency: roundtrip }));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
    };

    ws.onerror = () => setWsStatus('error');
    ws.onclose = () => {
      setWsStatus('closed');
      setTimeout(connectWs, 3000);
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => wsRef.current?.close();
  }, [connectWs]);

  const captureAndSend = useCallback(() => {
    if (
      modeRef.current === 'webcam' &&
      webcamRef.current &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      const imgSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (imgSrc) {
        sendTimeRef.current = Date.now();
        wsRef.current.send(imgSrc);
      }
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (activeMode === 'webcam') {
      setProcessedFrame(null);
      interval = setInterval(captureAndSend, 150); // ~6-7 FPS
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeMode, captureAndSend]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      alert('Backend not connected. Please ensure uvicorn is running.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      wsRef.current?.send(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleModeChange = (mode: Mode) => {
    setActiveMode(mode);
    setProcessedFrame(null);
    setFps(0);
    if (mode !== 'webcam') {
      setTimeout(() => fileInputRef.current?.click(), 50);
    }
  };

  const WsIndicator = () => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border transition-colors ${
      wsStatus === 'open' ? 'bg-core-green/10 border-core-green/30' : 
      wsStatus === 'connecting' ? 'bg-amber-400/10 border-amber-400/30' : 
      'bg-rose-500/10 border-rose-500/30'
    }`}>
      {wsStatus === 'open' ? <Wifi size={14} className="text-core-green" /> : 
       wsStatus === 'connecting' ? <Wifi size={14} className="text-amber-400" /> : 
       <WifiOff size={14} className="text-rose-500" />}
      <span className={`text-xs font-semibold ${
        wsStatus === 'open' ? 'text-core-green' : 
        wsStatus === 'connecting' ? 'text-amber-400' : 
        'text-rose-500'
      }`}>
        {wsStatus === 'open' ? 'Backend Connected' : wsStatus === 'connecting' ? 'Connecting...' : 'Backend Offline'}
      </span>
    </div>
  );

  if (hasModel === null) return null;
  if (hasModel === false) {
    return (
      <EmptyState
        title="No Model Uploaded"
        description="Upload a model from the Dashboard to run live inference in the Vision Playground."
      />
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-6 h-[calc(100vh-2rem)]">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-4xl font-extrabold mb-1 text-white tracking-tight">Vision Playground</h2>
          <p className="text-slate-400 font-light">Live YOLO inference via WebSocket</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <WsIndicator />

          {/* Segmented Control */}
          <div className="flex p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
            {([
              { id: 'webcam', icon: Camera, label: 'Webcam' },
              { id: 'image', icon: ImageIcon, label: 'Image' },
              { id: 'video', icon: Video, label: 'Video' }
            ] as const).map(mode => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMode === mode.id 
                    ? 'bg-core-purple shadow-[0_2px_10px_rgba(109,93,251,0.5)] text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <mode.icon size={16} /> {mode.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept={activeMode === 'video' ? 'video/*' : 'image/*'}
      />

      {/* Main View Area */}
      <div className="flex-1 relative rounded-[32px] overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center group">
        
        {/* Glow overlay */}
        <div className="absolute inset-0 border-[3px] border-core-purple/20 rounded-[32px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-30" />

        {/* FPS Badge */}
        {fps > 0 && (
          <div className="absolute top-6 left-6 z-40 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-core-green/30 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <span className="w-2 h-2 rounded-full bg-core-green animate-pulse" />
            <span className="text-core-green font-bold text-sm tracking-wider">FPS {fps}</span>
          </div>
        )}

        {/* Model Badge */}
        {wsStatus === 'open' && (
          <div className="absolute top-6 right-6 z-40 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-core-purple/30 text-core-purple font-medium text-sm shadow-[0_0_15px_rgba(109,93,251,0.2)]">
            {JSON.parse(localStorage.getItem('corevision_model') || '{}').name || 'yolov11n.pt'}
          </div>
        )}

        {/* --- WEBCAM MODE --- */}
        {activeMode === 'webcam' && (
          <>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user', width: 1280, height: 720 }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${processedFrame ? 'opacity-0' : 'opacity-100'}`}
              onUserMediaError={() => alert('Camera permission denied or no camera found.')}
            />

            {processedFrame && (
              <img
                src={processedFrame}
                alt="YOLO Inference"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}

            {!processedFrame && wsStatus === 'open' && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xl px-6 py-3 rounded-full text-slate-300 font-medium flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-core-purple border-t-transparent rounded-full animate-spin" />
                Initializing Neural Engine...
              </div>
            )}
          </>
        )}

        {/* --- IMAGE / VIDEO MODE --- */}
        {activeMode !== 'webcam' && (
          <>
            {processedFrame ? (
              <img
                src={processedFrame}
                alt="Inference Result"
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 cursor-pointer text-slate-500 hover:text-slate-300 transition-colors w-full h-full"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-dashed border-slate-600">
                  {activeMode === 'image' ? <ImageIcon size={40} /> : <Video size={40} />}
                </div>
                <p className="font-medium">Click to upload {activeMode === 'image' ? 'an image' : 'a video frame'}</p>
              </div>
            )}
          </>
        )}

        {/* Backend offline overlay */}
        {wsStatus !== 'open' && wsStatus !== 'connecting' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
            <AlertCircle size={56} className="text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
            <p className="text-2xl font-bold text-white tracking-tight">Backend Offline</p>
            <p className="text-slate-400 text-sm">Run: <code className="bg-white/10 px-2 py-1 rounded text-rose-300 font-mono ml-1">uvicorn main:app --reload --port 8000</code></p>
            <button 
              className="mt-4 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg shadow-[0_4px_14px_rgba(244,63,94,0.4)] transition-all"
              onClick={connectWs}
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionPlaygroundView;

import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, Activity, Play, BarChart3, Apple, Zap, GitCompare } from 'lucide-react';

import DashboardView from './views/DashboardView';
import ModelExplorerView from './views/ModelExplorerView';
import VisionPlaygroundView from './views/VisionPlaygroundView';
import ProfilerView from './views/ProfilerView';
import DeploymentAnalyzerView from './views/DeploymentAnalyzerView';
import OptimizationCopilotView from './views/OptimizationCopilotView';
import ComparisonReportView from './views/ComparisonReportView';
import AuroraBackground from './components/AuroraBackground';
import InteractiveNebulaShader from './components/InteractiveNebulaShader';
import SplashScreen from './components/SplashScreen';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Cpu, label: 'Dashboard' },
    { path: '/explorer', icon: Activity, label: 'Explorer' },
    { path: '/playground', icon: Play, label: 'Playground' },
    { path: '/profiler', icon: BarChart3, label: 'Profiler' },
    { path: '/deploy', icon: Apple, label: 'Deployment' },
    { path: '/copilot', icon: Zap, label: 'Copilot' },
    { path: '/report', icon: GitCompare, label: 'Report' },
  ];

  return (
    <motion.nav
      className="fixed top-8 left-8 bottom-8 z-50 glass-panel-heavy flex flex-col overflow-hidden shadow-2xl"
      initial={{ width: 280 }}
      animate={{ width: 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="p-6 flex items-center gap-4 mb-4 border-b border-white/5 pb-8">
        <motion.div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md shrink-0"
          animate={{ boxShadow: ['0 0 15px rgba(91,140,255,.15)', '0 0 30px rgba(91,140,255,.35)', '0 0 15px rgba(91,140,255,.15)'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src="/corevision_logo.png" alt="Logo" className="w-10 h-10 object-contain" />
        </motion.div>
        <span className="font-extrabold text-white whitespace-nowrap text-lg tracking-tight">
          CoreVision
        </span>
      </div>

      <div className="flex flex-col gap-2 px-4 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link to={item.path} key={item.path} className="text-decoration-none">
              <div
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'border border-[rgba(255,255,255,0.1)] text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                style={isActive ? { background: 'linear-gradient(90deg, rgba(91,140,255,.18), rgba(168,85,247,.18))' } : {}}
              >
                <div className={`shrink-0 transition-colors ${isActive ? 'text-core-purple drop-shadow-[0_0_8px_rgba(109,93,251,0.8)]' : ''}`}>
                  <item.icon size={22} />
                </div>
                <span className="font-semibold whitespace-nowrap text-[15px]">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<PageWrapper><DashboardView /></PageWrapper>} />
        <Route path="/explorer"  element={<PageWrapper><ModelExplorerView /></PageWrapper>} />
        <Route path="/playground" element={<PageWrapper><VisionPlaygroundView /></PageWrapper>} />
        <Route path="/profiler"  element={<PageWrapper><ProfilerView /></PageWrapper>} />
        <Route path="/deploy"    element={<PageWrapper><DeploymentAnalyzerView /></PageWrapper>} />
        <Route path="/copilot"   element={<PageWrapper><OptimizationCopilotView /></PageWrapper>} />
        <Route path="/report"    element={<PageWrapper><ComparisonReportView /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => (
  <>
    {/* Aurora ambient orbs */}
    <div className="orb orb1" aria-hidden="true" />
    <div className="orb orb2" aria-hidden="true" />
    <div className="orb orb3" aria-hidden="true" />
    <AuroraBackground />
    <InteractiveNebulaShader />
    <Navigation />
    <main className="ml-[330px] w-[calc(100%-330px)] h-screen overflow-y-auto overflow-x-hidden">
      <AnimatedRoutes />
    </main>
  </>
);

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      <AnimatePresence>
        {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      </AnimatePresence>

      <AnimatePresence>
        {splashDone && (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Router>
              <AppContent />
            </Router>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;

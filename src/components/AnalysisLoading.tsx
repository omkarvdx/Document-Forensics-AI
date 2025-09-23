import React, { useState, useEffect } from 'react';

const analysisSteps = [
  'Initializing AI models...',
  'Processing image data...',
  'Detecting visual anomalies...',
  'Analyzing compression artifacts...',
  'Examining lighting consistency...',
  'Checking for tampering signs...',
  'Calculating confidence scores...',
  'Generating forensic report...'
];

export const AnalysisLoading: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % analysisSteps.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress > 95 ? 95 : newProgress;
      });
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Main Loading Animation */}
      <div className="relative mb-8">
        {/* Outer rotating ring */}
        <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        
        {/* Middle ring */}
        <div className="absolute inset-2 w-16 h-16 border-3 border-primary/30 border-b-primary rounded-full animate-spin animate-reverse" 
             style={{ animationDuration: '3s' }}></div>
        
        {/* Inner core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg animate-pulse shadow-lg">
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pulsing dots around */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-40px)`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* AI Brain Animation */}
      <div className="mb-6 relative">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center animate-bounce">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex space-x-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-6 bg-gradient-to-t from-primary to-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Title */}
      <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2 animate-pulse">
        AI is performing forensic analysis...
      </h3>
      
      {/* Dynamic Step */}
      <p className="text-muted-foreground text-base mb-6 min-h-6 transition-all duration-500">
        {analysisSteps[currentStep]}
      </p>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-blue-500 to-purple-500 rounded-full transition-all duration-300 animate-glow"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Processing Indicators */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {[
          { label: 'Image Processing', icon: '🖼️' },
          { label: 'Pattern Analysis', icon: '🔍' },
          { label: 'AI Validation', icon: '🧠' },
          { label: 'Report Generation', icon: '📄' }
        ].map((item, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div className={`text-lg transition-all duration-300 ${
              currentStep >= index * 2 ? 'animate-bounce' : 'opacity-30'
            }`}>
              {item.icon}
            </div>
            <span className={`transition-all duration-300 ${
              currentStep >= index * 2 ? 'text-foreground' : 'text-muted-foreground/50'
            }`}>
              {item.label}
            </span>
            {currentStep >= index * 2 && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Time Estimate */}
      <p className="text-xs text-muted-foreground mt-6 animate-pulse">
        Estimated time: 15-30 seconds • Deep learning model analysis
      </p>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${10 + i * 10}%`,
              top: `${20 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${4 + i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { FileUpload } from '../components/FileUpload';
import { AnalysisResultDisplay } from '../components/AnalysisResultDisplay';
import { Loader } from '../components/Loader';
import { LoadingScreen } from '../components/LoadingScreen';
import { AnalysisLoading } from '../components/AnalysisLoading';
import { analyzeDocument } from '../services/aiService';
import { useModelConfig } from '../hooks/useModelConfig';
import { usePersistedState, usePersistedFileState } from '../hooks/usePersistedState';
import { clearApiKeys } from '../utils/apiKeyUtils';
import type { AnalysisResult } from '../types';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon';
import { SettingsIcon } from '../components/icons/SettingsIcon';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const DocumentForensics: React.FC = () => {
  // Use persisted state for file data
  const { selectedFile, previewUrl, handleFileSelect: handlePersistedFileSelect, clearFileData } = usePersistedFileState();
  
  // Use persisted state for analysis results and other data
  const [analysisResult, setAnalysisResult, clearAnalysisResult] = usePersistedState<AnalysisResult | null>('forensics_analysisResult', null);
  const [userContext, setUserContext, clearUserContext] = usePersistedState<string>('forensics_userContext', '');
  
  // Keep loading and error states as regular state (don't need persistence)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  const { config, setConfig, isLoaded } = useModelConfig();

  // Simulate initial loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleFileSelect = (file: File) => {
    handlePersistedFileSelect(file);
    setAnalysisResult(null);
    setError(null);
  };

  const handleClearAll = useCallback(() => {
    // Clear file data, analysis results, and user context
    clearFileData();
    clearAnalysisResult();
    clearUserContext();
    
    // Clear API keys from storage
    clearApiKeys();
    
    // Update config to remove API keys from memory
    setConfig({
      ...config,
      apiKeys: {}
    });
    
    // Clear UI state
    setError(null);
    setIsLoading(false);
  }, [clearFileData, clearAnalysisResult, clearUserContext, config, setConfig]);

  const handleAnalyzeClick = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select a document image to analyze.");
      return;
    }

    if (!isLoaded) {
      setError("Model configuration is still loading. Please wait.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeDocument(selectedFile, userContext, {
        provider: config.provider as any,
        model: config.model || undefined,
        azureDeployment: config.azureDeployment || undefined,
        parameters: config.parameters,
        apiKeys: config.apiKeys
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, userContext, config, isLoaded]);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Document Forensics AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Leveraging advanced multimodal AI to detect signs of digital tampering in documents. 
              This tool performs a forensic analysis without needing the original copy for comparison.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Upload Section */}
            <Card className="bg-gradient-card border shadow-card">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary flex items-center">
                  <span className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </span>
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload onFileSelect={handleFileSelect} previewUrl={previewUrl} />
                
                <div>
                  <label htmlFor="user-context" className="block text-sm font-medium text-foreground mb-2">
                    <span className="bg-primary/10 text-primary rounded-full w-6 h-6 inline-flex items-center justify-center text-xs font-bold mr-2">
                      2
                    </span>
                    Add Specific Concerns (Optional)
                  </label>
                  <Textarea
                    id="user-context"
                    rows={3}
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    placeholder="e.g., 'Pay close attention to the signature on the bottom right.' or 'I suspect the date was altered.'"
                    className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex justify-center space-x-4">
                  <Link
                    to="/config"
                    className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors duration-200 text-sm"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span>Configure AI Model ({config.provider})</span>
                  </Link>
                  
                  {(selectedFile || analysisResult || userContext) && (
                    <button
                      onClick={handleClearAll}
                      className="inline-flex items-center space-x-2 text-destructive hover:text-destructive/80 transition-colors duration-200 text-sm"
                      title="Clear uploaded files, analysis results, user context, and API keys"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Clear All Data</span>
                    </button>
                  )}
                </div>

                <Button
                  onClick={handleAnalyzeClick}
                  disabled={!selectedFile || isLoading}
                  className="w-full bg-gradient-primary hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 inline-flex items-center justify-center text-xs font-bold mr-1">
                        3
                      </span>
                      <span>Analyze Document</span>
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="bg-gradient-card border shadow-card min-h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">
                  Forensic Report
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 max-h-[70vh] overflow-y-auto">
                {isLoading && <AnalysisLoading />}
                
                {error && (
                  <div className="text-center py-12">
                    <div className="text-destructive bg-destructive/10 p-6 rounded-xl border border-destructive/20">
                      <p className="font-bold text-lg mb-2">Analysis Failed</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
                
                {analysisResult && <AnalysisResultDisplay result={analysisResult} />}
                
                {!isLoading && !error && !analysisResult && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                      <SettingsIcon className="h-8 w-8" />
                    </div>
                    <p className="text-lg">Your document's forensic report will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Disclaimer */}
          <Card className="mt-12 bg-muted/30 border-muted">
            <CardContent className="p-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  <span className="font-bold">Disclaimer:</span> This AI-powered analysis is for informational purposes only 
                  and should not be considered definitive legal or forensic proof. The results are based on pattern recognition 
                  and may not be 100% accurate. Always consult a qualified human expert for critical applications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DocumentForensics;
// Analysis result types
export interface AnalysisResult {
  analysisLog: string;
  overallAssessment: OverallAssessment;
  confidenceScore: number;
  summary: string;
  technicalSummary: string;
  detailedFindings: DetailedFinding[];
  coverageNotes: string;
  imageQualityScore: number;
  abstainedReasons: string[];
  promptVersion: string;
}

export enum OverallAssessment {
  LIKELY_AUTHENTIC = 'LIKELY_AUTHENTIC',
  SUSPICIOUS_ANOMALIES_DETECTED = 'SUSPICIOUS_ANOMALIES_DETECTED',
  LIKELY_TAMPERED = 'LIKELY_TAMPERED',
  MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export interface DetailedFinding {
  finding: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High';
  artifactType: ArtifactType;
  region: Region;
  evidenceStrength: number;
  benignAlternatives: string[];
  crossChecks: string[];
  geometricConsistency: 'aligned' | 'skewed' | 'warped' | null;
  lightingVector: {
    direction: number;
    softness: number;
  };
  resamplingIndicators: string[];
  cloneMatches: CloneMatch[];
}

export enum ArtifactType {
  COMPRESSION = 'COMPRESSION',
  CLONING = 'CLONING',
  HALOING = 'HALOING',
  NOISE_MISMATCH = 'NOISE_MISMATCH',
  KERNING = 'KERNING',
  RESAMPLING = 'RESAMPLING',
  LIGHTING = 'LIGHTING',
  PAPER_TEXTURE = 'PAPER_TEXTURE',
  STAMP_SEAL = 'STAMP_SEAL',
  SIGNATURE = 'SIGNATURE',
  ALIGNMENT = 'ALIGNMENT',
  FABRICATED_CONTENT = 'FABRICATED_CONTENT',
  OTHER = 'OTHER'
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CloneMatch {
  region1: Region;
  region2: Region;
  similarity: number;
}

// Model configuration types
export type Provider = 'google' | 'azure-openai' | 'openai' | 'bedrock-openai';

export interface AnalyzeOptions {
  provider?: Provider;
  model?: string;
  azureDeployment?: string;
  parameters?: any;
}

export interface ModelConfig {
  provider: Provider;
  model: string;
  azureDeployment?: string;
  parameters?: ModelParameterConfig;
}

export type ModelType = 'gpt-4o' | 'gpt-5' | 'o-series' | 'legacy';

export interface ModelParameterConfig {
  modelType: ModelType;
  parameters: StandardModelParameters | GPT5ModelParameters | ReasoningModelParameters;
}

// Base parameters interface
export interface BaseModelParameters {
  temperature: number;
}

// Standard OpenAI models (GPT-4o, etc.)
export interface StandardModelParameters extends BaseModelParameters {
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// GPT-5 series models
export interface GPT5ModelParameters extends BaseModelParameters {
  maxCompletionTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  responseFormat?: {
    type: 'text' | 'json_object';
  };
}

// O-series reasoning models
export interface ReasoningModelParameters extends BaseModelParameters {
  maxOutputTokens: number;
  reasoningEffort: 'low' | 'medium' | 'high';
  reasoningStrategy: 'default' | 'cot' | 'stepwise';
  // Add optional properties for compatibility
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
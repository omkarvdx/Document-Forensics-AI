import React, { useState } from 'react';
import type { AnalysisResult, DetailedFinding } from '../types';
import { OverallAssessment } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ShieldExclamationIcon } from './icons/ShieldExclamationIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { BrainIcon } from './icons/BrainIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import '../styles/findingCards.css';

const assessmentConfig = {
    [OverallAssessment.LIKELY_AUTHENTIC]: {
        label: 'Likely Authentic',
        shortLabel: 'Authentic',
        icon: <CheckCircleIcon className="h-7 w-7" />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-950/30',
        borderColor: 'border-emerald-500/30',
        accentColor: 'bg-emerald-500/20',
        progressColor: 'bg-emerald-500',
        description: 'Document appears to be authentic with no significant tampering indicators detected.'
    },
    [OverallAssessment.SUSPICIOUS_ANOMALIES_DETECTED]: {
        label: 'Suspicious Anomalies Detected',
        shortLabel: 'Suspicious',
        icon: <ExclamationTriangleIcon className="h-7 w-7" />,
        color: 'text-amber-400',
        bgColor: 'bg-amber-950/30',
        borderColor: 'border-amber-500/30',
        accentColor: 'bg-amber-500/20',
        progressColor: 'bg-amber-500',
        description: 'Some anomalies detected that may require further investigation.'
    },
    [OverallAssessment.LIKELY_TAMPERED]: {
        label: 'Likely Tampered',
        shortLabel: 'Tampered',
        icon: <ShieldExclamationIcon className="h-7 w-7" />,
        color: 'text-rose-400',
        bgColor: 'bg-rose-950/30',
        borderColor: 'border-rose-500/30',
        accentColor: 'bg-rose-500/20',
        progressColor: 'bg-rose-500',
        description: 'Strong evidence of tampering or digital manipulation detected.'
    }
};

const severityConfig = {
    Low: {
        color: 'text-sky-400',
        bgColor: 'bg-sky-950/30',
        borderColor: 'border-sky-500/30',
        progressColor: 'bg-sky-500',
        label: 'Low Risk',
        badgeColor: 'bg-sky-500/20 text-sky-300'
    },
    Medium: {
        color: 'text-amber-400',
        bgColor: 'bg-amber-950/30',
        borderColor: 'border-amber-500/30',
        progressColor: 'bg-amber-500',
        label: 'Medium Risk',
        badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    High: {
        color: 'text-rose-400',
        bgColor: 'bg-rose-950/30',
        borderColor: 'border-rose-500/30',
        progressColor: 'bg-rose-500',
        label: 'High Risk',
        badgeColor: 'bg-rose-500/20 text-rose-300'
    },
};

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
  badgeColor?: string;
}> = ({ title, icon, children, defaultExpanded = false, badge, badgeColor }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-gray-400">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
          {badge && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor || 'bg-gray-600 text-gray-300'}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-400">
          {isExpanded ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-700/50">
          {children}
        </div>
      )}
    </div>
  );
};

// Finding Summary Component
const FindingSummary: React.FC<{ findings: DetailedFinding[] }> = ({ findings }) => {
  const severityCounts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {Object.entries(severityCounts).map(([severity, count]) => {
        const config = severityConfig[severity as keyof typeof severityConfig];
        return (
          <div key={severity} className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor} transition-all hover:scale-105`}>
            <div className="flex items-center justify-between">
              <span className={`text-base font-medium ${config.color}`}>{config.label}</span>
              <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${config.badgeColor}`}>
                {count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Individual Finding Card
const FindingCard: React.FC<{ finding: DetailedFinding; index: number }> = ({ finding, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = severityConfig[finding.severity];

  // Safe rendering helpers
  const safeToFixed = (num: number, decimals: number = 2) => {
    try {
      if (typeof num !== 'number' || isNaN(num)) return '0.00';
      return num.toFixed(decimals);
    } catch {
      return '0.00';
    }
  };

  const safeJoin = (arr: string[] | undefined) => {
    if (!Array.isArray(arr)) return '';
    return arr.filter(item => typeof item === 'string').join(', ');
  };

  return (
    <div className={`finding-card rounded-lg border ${config.borderColor} overflow-hidden shadow-sm`}>
      {/* Header */}
      <div
        className={`finding-card-header cursor-pointer hover:opacity-90 transition-opacity ${config.bgColor} p-5`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start space-x-4 min-w-0 flex-1">
            <span className="text-sm font-mono text-gray-500 shrink-0 mt-0.5">#{index + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="finding-text finding-description text-base font-medium text-gray-200 break-words leading-relaxed mb-2">
                {finding.finding || 'Finding description'}
              </p>
              <p className="finding-text text-sm text-gray-400 break-words">
                {finding.location || 'Unknown location'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
              {config.label}
            </span>
            {isExpanded ?
              <ChevronDownIcon className="h-5 w-5 text-gray-400" /> :
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            }
          </div>
        </div>

        {/* Quick metadata row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-gray-500 finding-metadata">
          {finding.artifactType && (
            <span className="shrink-0">Type: {finding.artifactType}</span>
          )}
          {finding.region && (
            <span className="shrink-0">Region: {safeToFixed(finding.region.x)},{safeToFixed(finding.region.y)}</span>
          )}
          {typeof finding.evidenceStrength === 'number' && (
            <span className="shrink-0">Strength: {safeToFixed(finding.evidenceStrength * 100, 0)}%</span>
          )}
          {finding.geometricConsistency && (
            <span className="shrink-0">Geometry: {finding.geometricConsistency}</span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-700/50 bg-gray-900/20">
          <div className="space-y-3 pt-4">
            {finding.geometricConsistency && (
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Geometry:</span> {finding.geometricConsistency}
              </p>
            )}
            {finding.lightingVector && (
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Lighting:</span> {safeToFixed(finding.lightingVector.direction, 0)}° direction, {safeToFixed(finding.lightingVector.softness * 100, 0)}% softness
              </p>
            )}
            {finding.resamplingIndicators && finding.resamplingIndicators.length > 0 && (
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Resampling:</span> {safeJoin(finding.resamplingIndicators)}
              </p>
            )}
            {finding.cloneMatches && finding.cloneMatches.length > 0 && (
              <div className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Clone matches:</span>
                <div className="ml-2 mt-1 space-y-1">
                  {finding.cloneMatches.slice(0, 2).map((match, idx) => (
                    <div key={idx} className="bg-gray-800/50 p-2 rounded text-xs">
                      Region 1: {safeToFixed(match.region1.x)},{safeToFixed(match.region1.y)} ({safeToFixed(match.region1.width)}×{safeToFixed(match.region1.height)})
                      <br />
                      Region 2: {safeToFixed(match.region2.x)},{safeToFixed(match.region2.y)} ({safeToFixed(match.region2.width)}×{safeToFixed(match.region2.height)})
                      <br />
                      Similarity: {safeToFixed(match.similarity * 100, 0)}%
                    </div>
                  ))}
                </div>
              </div>
            )}
            {finding.benignAlternatives && finding.benignAlternatives.length > 0 && (
              <div className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Possible benign explanations:</span>
                <ul className="ml-2 mt-1 list-disc list-inside space-y-1">
                  {finding.benignAlternatives.map((alt, idx) => (
                    <li key={idx}>{alt}</li>
                  ))}
                </ul>
              </div>
            )}
            {finding.crossChecks && finding.crossChecks.length > 0 && (
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">Cross-checks performed:</span> {safeJoin(finding.crossChecks)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
  const config = assessmentConfig[result.overallAssessment];
  const findings = result.detailedFindings || [];

  // Calculate severity distribution
  const severityStats = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Assessment Summary */}
      <div className={`rounded-xl p-6 ${config.bgColor} border ${config.borderColor}`}>
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${config.accentColor}`}>
            <span className={config.color}>{config.icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className={`text-2xl font-bold ${config.color}`}>{config.label}</h2>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-400">Confidence:</div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.progressColor} transition-all duration-500`}
                      style={{ width: `${result.confidenceScore * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${config.color}`}>
                    {Math.round(result.confidenceScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 mb-3">{config.description}</p>
            <p className="text-sm text-gray-400">{result.summary}</p>
          </div>
        </div>
      </div>

      {/* Findings Overview */}
      {findings.length > 0 && (
        <CollapsibleSection
          title="Findings Overview"
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          badge={`${findings.length} issues`}
          badgeColor="bg-rose-500/20 text-rose-300"
          defaultExpanded={true}
        >
          <FindingSummary findings={findings} />

          <div className="findings-scroll-container space-y-4 max-h-[32rem] overflow-y-auto pr-2">
            {findings.map((finding, index) => (
              <FindingCard
                key={`${finding.finding?.substring(0, 30) || 'finding'}-${index}`}
                finding={finding}
                index={index}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Technical Details */}
      <CollapsibleSection
        title="Technical Analysis"
        icon={<BrainIcon className="h-5 w-5" />}
      >
        {result.technicalSummary && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Technical Summary</h4>
            <p className="text-sm text-gray-400">{result.technicalSummary}</p>
          </div>
        )}

        {result.coverageNotes && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Coverage Analysis</h4>
            <p className="text-sm text-gray-400">{result.coverageNotes}</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">AI Analysis Process</h4>
          <div className="bg-gray-900/70 p-4 rounded-lg max-h-80 overflow-y-auto border border-gray-700">
            <p className="text-sm text-gray-400 whitespace-pre-wrap font-mono">{result.analysisLog}</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Analysis Metadata */}
      {(result.imageQualityScore !== undefined || result.abstainedReasons?.length || result.promptVersion) && (
        <CollapsibleSection
          title="Analysis Metadata"
          icon={<ShieldExclamationIcon className="h-5 w-5" />}
        >
          {result.imageQualityScore !== undefined && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Image Quality Assessment</h4>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                      style={{ width: `${result.imageQualityScore * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 font-medium">
                  {Math.round(result.imageQualityScore * 100)}%
                </span>
              </div>
            </div>
          )}

          {result.abstainedReasons?.length && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-amber-400 mb-2">Analysis Limitations</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                {result.abstainedReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-400 mt-1">⚠</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.promptVersion && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Analysis Version</h4>
              <p className="text-sm text-gray-400">{result.promptVersion}</p>
            </div>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
};

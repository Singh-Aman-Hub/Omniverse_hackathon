import React from 'react';
import type { SafetyReport } from '../types';
import { ShieldIcon, AlertTriangleIcon } from './icons';

interface SafetyCardProps {
  report: SafetyReport;
}

const getRiskColorClasses = (level: SafetyReport['risk_level']) => {
  switch (level) {
    case 'low':
      return {
        bg: 'bg-green-500/20',
        text: 'text-green-300',
        border: 'border-green-500',
        scoreText: 'text-green-400',
      };
    case 'moderate':
      return {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-300',
        border: 'border-yellow-500',
        scoreText: 'text-yellow-400',
      };
    case 'high':
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-300',
        border: 'border-orange-500',
        scoreText: 'text-orange-400',
      };
    case 'extreme':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-300',
        border: 'border-red-500',
        scoreText: 'text-red-400',
      };
    default:
      return {
        bg: 'bg-gray-500/20',
        text: 'text-gray-300',
        border: 'border-gray-500',
        scoreText: 'text-gray-400',
      };
  }
};

export const SafetyCard: React.FC<SafetyCardProps> = ({ report }) => {
  const { safety_score, risk_level, reasons } = report;
  const colors = getRiskColorClasses(risk_level);

  return (
    <div className={`absolute top-4 right-4 z-10 w-80 max-w-sm p-4 rounded-lg shadow-2xl backdrop-blur-md border ${colors.border} ${colors.bg}`}>
      <div className="flex items-center justify-between mb-2">
  <h3 className={`text-lg font-bold ${colors.text}`}>Facility Status</h3>
        {risk_level === 'low' || risk_level === 'moderate' ? (
          <ShieldIcon className={`w-6 h-6 ${colors.text}`} />
        ) : (
          <AlertTriangleIcon className={`w-6 h-6 ${colors.text}`} />
        )}
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex flex-col items-center">
          <span className="text-sm text-gray-400">Rating</span>
          <span className={`text-4xl font-bold ${colors.scoreText}`}>{safety_score}</span>
        </div>
        <div className="flex-1">
          <span className="text-sm text-gray-400">Facility Type</span>
          <p className={`text-xl font-semibold capitalize ${colors.text}`}>{risk_level}</p>
        </div>
      </div>
      
      <div>
  <h4 className="font-semibold text-gray-300 mb-1">Details:</h4>
  <p className="text-sm text-gray-400 leading-relaxed">{reasons}</p>
      </div>
    </div>
  );
};

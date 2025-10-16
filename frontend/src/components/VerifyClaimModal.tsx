import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { VerificationResult } from '../types';
import { LoadingSpinner, XIcon } from './icons';

interface VerifyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (claim: string) => void;
  result: VerificationResult | null;
  isLoading: boolean;
}

const VerdictBadge: React.FC<{ verdict: VerificationResult['verdict'] }> = ({ verdict }) => {
  const styles = {
    'Likely True': 'bg-green-500/20 text-green-300',
    'Unverified': 'bg-yellow-500/20 text-yellow-300',
    'Likely False': 'bg-red-500/20 text-red-300',
  };
  return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[verdict]}`}>{verdict}</span>;
};


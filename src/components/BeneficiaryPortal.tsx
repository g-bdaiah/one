import React from 'react';
import BeneficiarySearchDashboard from './BeneficiarySearchDashboard';

export default function BeneficiaryPortal({ onBack }: { onBack: () => void }) {
  return <BeneficiarySearchDashboard onBack={onBack} />;
}

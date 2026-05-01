import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { UserTypeSelector } from './UserTypeSelector';
import { OrganizationSetup } from './OrganizationSetup';
import { SinglePharmacySetup } from './SinglePharmacySetup';
import { trpc } from '../lib/trpc';

type SignupStep = 'type-selection' | 'organization-setup' | 'single-pharmacy-setup' | 'complete';

interface SignupFlowProps {
  onComplete?: () => void;
}

export function SignupFlow({ onComplete }: SignupFlowProps) {
  const [step, setStep] = useState<SignupStep>('type-selection');
  const [selectedType, setSelectedType] = useState<'organization_owner' | 'single_pharmacy' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // Query to check if user already has a type set
  const userTypeQuery = trpc.branches.userType.get.useQuery(undefined, {
    retry: false,
  });

  // Check if user already completed setup
  useEffect(() => {
    if (userTypeQuery.data?.data) {
      // User already has a type set, redirect to dashboard
      setLocation('/');
    }
  }, [userTypeQuery.data, setLocation]);

  const handleTypeSelect = async (type: 'organization_owner' | 'single_pharmacy') => {
    setSelectedType(type);
    setIsLoading(true);

    try {
      if (type === 'organization_owner') {
        setStep('organization-setup');
      } else {
        setStep('single-pharmacy-setup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationComplete = (organizationId: number) => {
    setStep('complete');
    // Redirect to dashboard after a brief delay
    setTimeout(() => {
      setLocation('/');
      onComplete?.();
    }, 1000);
  };

  const handleSinglePharmacyComplete = () => {
    setStep('complete');
    // Redirect to dashboard after a brief delay
    setTimeout(() => {
      setLocation('/');
      onComplete?.();
    }, 1000);
  };

  const handleBack = () => {
    setStep('type-selection');
    setSelectedType(null);
  };

  // Show loading state while checking user type
  if (userTypeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate step
  if (step === 'type-selection') {
    return <UserTypeSelector onSelect={handleTypeSelect} isLoading={isLoading} />;
  }

  if (step === 'organization-setup') {
    return (
      <OrganizationSetup
        onComplete={handleOrganizationComplete}
        onCancel={handleBack}
      />
    );
  }

  if (step === 'single-pharmacy-setup') {
    return (
      <SinglePharmacySetup
        onComplete={handleSinglePharmacyComplete}
        onCancel={handleBack}
      />
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-bounce">
            <div className="text-5xl">✓</div>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Setup Complete!</h1>
          <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}

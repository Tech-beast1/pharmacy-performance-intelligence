import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Building2, Store } from 'lucide-react';

interface UserTypeSelectorProps {
  onSelect: (type: 'organization_owner' | 'single_pharmacy') => void;
  isLoading?: boolean;
}

export function UserTypeSelector({ onSelect, isLoading = false }: UserTypeSelectorProps) {
  const [selected, setSelected] = useState<'organization_owner' | 'single_pharmacy' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PPI</h1>
            <p className="text-gray-600">Choose how you'd like to use Pharmacy Performance Intelligence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Organization Owner Option */}
            <button
              onClick={() => setSelected('organization_owner')}
              className={`p-6 rounded-lg border-2 transition-all ${
                selected === 'organization_owner'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <Building2 className="w-12 h-12 text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Owner</h2>
                <p className="text-sm text-gray-600 text-center">
                  Manage multiple pharmacy branches with consolidated analytics
                </p>
                <ul className="mt-4 text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Multiple branches</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Consolidated metrics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Team management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Branch comparison</span>
                  </li>
                </ul>
              </div>
            </button>

            {/* Single Pharmacy Option */}
            <button
              onClick={() => setSelected('single_pharmacy')}
              className={`p-6 rounded-lg border-2 transition-all ${
                selected === 'single_pharmacy'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <Store className="w-12 h-12 text-green-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Single Pharmacy Owner</h2>
                <p className="text-sm text-gray-600 text-center">
                  Manage your pharmacy's performance with focused analytics
                </p>
                <ul className="mt-4 text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Simple dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Core analytics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Easy to use</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Upgrade anytime</span>
                  </li>
                </ul>
              </div>
            </button>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => onSelect(selected!)}
              disabled={!selected || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? 'Setting up...' : 'Continue'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can change this later in your account settings
          </p>
        </div>
      </Card>
    </div>
  );
}

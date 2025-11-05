import React from 'react';
import { Info, Users, Lock } from 'lucide-react';

interface UnifiedLoginNoticeProps {
  className?: string;
}

export default function UnifiedLoginNotice({ className = "" }: UnifiedLoginNoticeProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            🔄 Unified Login System
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            <strong>Same login credentials work for all user types!</strong> Once you sign up, you can access:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-white p-2 rounded">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">
                <strong>Buyer Dashboard</strong><br />
                Browse properties
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white p-2 rounded">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-gray-700">
                <strong>Seller Dashboard</strong><br />
                List properties
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white p-2 rounded">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-gray-700">
                <strong>Agent Dashboard</strong><br />
                Manage clients
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-xs text-blue-700">
            <Lock className="h-3 w-3" />
            <span>Your role and permissions are determined automatically based on your activities</span>
          </div>
        </div>
      </div>
    </div>
  );
}

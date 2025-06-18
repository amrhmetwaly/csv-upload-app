import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AlertMessage } from '../types/shared';

interface AlertProps {
  alert: AlertMessage;
  onRemove: (alert: AlertMessage) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info
};

const colorMap = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200'
};

export const Alert: React.FC<AlertProps> = ({ alert, onRemove }) => {
  const IconComponent = iconMap[alert.type];

  return (
    <div className={`flex items-start p-4 rounded-xl border-2 ${colorMap[alert.type]} shadow-sm animate-in slide-in-from-top duration-300`}>
      <div className="flex-shrink-0 mr-3">
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 text-sm font-medium">
        {alert.message}
      </div>
      <button
        onClick={() => onRemove(alert)}
        className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close alert"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
    </div>
  );
};

interface AlertListProps {
  alerts: AlertMessage[];
  onRemove: (alert: AlertMessage) => void;
}

export const AlertList: React.FC<AlertListProps> = ({ alerts, onRemove }) => {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mb-8 space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id || `${alert.type}-${alert.message}`} alert={alert} onRemove={onRemove} />
      ))}
    </div>
  );
}; 
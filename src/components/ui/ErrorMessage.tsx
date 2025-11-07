import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className = '',
  variant = 'error'
}) => {
  const variantStyles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`rounded-lg border p-6 ${styles.container} ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className={`w-6 h-6 mt-0.5 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1">
          <h3 className="font-medium mb-1">
            {variant === 'error' ? 'Something went wrong' : 
             variant === 'warning' ? 'Warning' : 'Information'}
          </h3>
          <p className="text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      
      {onRetry && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onRetry}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${styles.button}`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;

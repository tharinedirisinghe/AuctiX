import React from 'react';
import { X } from 'lucide-react';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    description?: string;
    status: string;
    transactionDate: string;
    amount: number | string;
    type?: string;
  } | null;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Get status class based on transaction status
  const getStatusClass = () => {
    if (!transaction) return 'bg-green-100 text-green-800';
    
    switch (transaction.status) {
      case 'FAILED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        // All other statuses show as Success
        return 'bg-green-100 text-green-800';
    }
  };

  // Get status text based on transaction status
  const getStatusText = () => {
    if (!transaction) return 'Success';
    
    switch (transaction.status) {
      case 'FAILED':
      case 'REJECTED':
        return 'Failed';
      default:
        // All other statuses show as Success
        return 'Success';
    }
  };

  const getTypeClass = () => {
    switch (transaction.status) {
      case 'CREDITED':
      case 'UNFREEZED':
        return 'text-green-600';
      case 'DEBITED':
      case 'COMPLETED':
        return 'text-red-600';
      case 'FREEZED':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-lg font-semibold">
                LKR{' '}
                {Number(transaction.amount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex space-x-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-full ${getStatusClass()} text-xs`}
              >
                {getStatusText()}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full bg-gray-100 ${getTypeClass()} text-xs font-medium`}
              >
                {transaction.type ||
                  (transaction.status === 'CREDITED'
                    ? 'Credit'
                    : transaction.status === 'DEBITED'
                      ? 'Debit'
                      : transaction.status === 'FREEZED'
                        ? 'Frozen'
                        : transaction.status === 'UNFREEZED'
                          ? 'Unfrozen'
                          : transaction.status === 'COMPLETED'
                            ? 'COMPLETED'
                            : transaction.status)}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Transaction ID
            </h3>
            <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200 font-mono break-all">
              {transaction.id}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Date & Time
            </h3>
            <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
              {formatDate(transaction.transactionDate)}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Description
            </h3>
            <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
              {transaction.description || '-'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-0.5 rounded-full ${getStatusClass()} text-xs`}
              >
                {getStatusText()}
              </span>
              <span className="text-sm text-gray-600">
                {getStatusText() === 'Success' 
                  ? 'Transaction completed successfully'
                  : 'Transaction failed or was rejected'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-amber-600 border border-yellow-200 rounded text-white hover:bg-amber-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;

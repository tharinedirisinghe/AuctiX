import React, { useEffect, useState } from 'react';
import {
  Search,
  InfoIcon,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWalletInfo,
  fetchTransactionHistory,
  initializeWallet,
  addFunds,
  withdrawAmount,
  selectWalletInfo,
  selectTransactions,
  selectWalletLoading,
  clearWalletError,
} from '@/store/slices/walletSlice';
import RechargeModal from '@/components/wallet/RechargeModal';
import WithdrawModal from '@/components/wallet/WithdrawModal';
import TransactionDetailsModal from '@/components/wallet/TransactionDetailsModal';
import { AppDispatch } from '@/store/store';

const WalletPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const walletInfo = useSelector(selectWalletInfo);
  const transactions = useSelector(selectTransactions);
  const isLoading = useSelector(selectWalletLoading);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState<boolean>(false);
  const [createWalletError, setCreateWalletError] = useState<string | null>(
    null,
  );
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetails, setShowTransactionDetails] =
    useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    [],
  );
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(clearWalletError());
    dispatch(fetchWalletInfo())
      .unwrap()
      .then(() => {
        dispatch(fetchTransactionHistory());
      })
      .catch((error) => {
        console.error('Wallet info error:', error);
      });
  }, [dispatch]);

  const handleCreateWallet = () => {
    setIsCreatingWallet(true);
    setCreateWalletError(null);

    dispatch(initializeWallet())
      .unwrap()
      .then(() => {
        dispatch(fetchTransactionHistory());
        setIsCreatingWallet(false);
      })
      .catch((error) => {
        setIsCreatingWallet(false);
        if (error.message?.includes('already exists')) {
          dispatch(fetchWalletInfo());
        } else {
          setCreateWalletError(
            'Failed to access wallet. Please try again later.',
          );
        }
      });
  };

  const handleRecharge = (amount: number) => {
    dispatch(addFunds(amount))
      .unwrap()
      .then(() => {
        dispatch(fetchWalletInfo());
        dispatch(fetchTransactionHistory());
        setShowRechargeModal(false);
      })
      .catch((error) => {
        console.error('Recharge error:', error);
      });
  };

  const handleWithdraw = (data: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  }) => {
    dispatch(withdrawAmount(data))
      .unwrap()
      .then(() => {
        dispatch(fetchWalletInfo());
        dispatch(fetchTransactionHistory());
        setShowWithdrawModal(false);
      })
      .catch((error) => {
        console.error('Withdraw error:', error);
      });
  };

  // Define Transaction type based on the properties used
  type Transaction = {
    id: string;
    description?: string;
    status: string;
    transactionDate: string;
    amount: number | string;
  };

  // Apply all filters to transactions
  const applyFilters = (transactions: Transaction[]) => {
    let filtered = transactions;

    // Apply search filter
    filtered = filtered.filter(
      (transaction) =>
        transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.description &&
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (transaction.status &&
          transaction.status.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((transaction) => {
        if (typeFilter === 'credit')
          return (
            transaction.status === 'CREDITED' ||
            transaction.status === 'UNFREEZED'
          );
        if (typeFilter === 'debit') return transaction.status === 'DEBITED';
        if (typeFilter === 'frozen') return transaction.status === 'FREEZED';
        if (typeFilter === 'completed')
          return transaction.status === 'COMPLETED';
        return true;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((transaction) => {
        try {
          // Handle possible null or undefined transaction status
          if (!transaction.status) return false;

          // Simplified status filtering - works directly with the raw status
          const filterValue = statusFilter.toLowerCase().trim();

          if (filterValue === 'success') {
            // All statuses now show as "Success"
            return [
              'credited',
              'debited',
              'unfreezed',
              'freezed',
              'completed',
            ].includes(transaction.status.toLowerCase());
          } else if (filterValue === 'pending') {
            // No statuses currently map to pending in our new logic,
            // but we keep this for potential future status types
            return false;
          }

          // Direct comparison as fallback
          return transaction.status.toLowerCase() === filterValue;
        } catch (error) {
          console.error('Error filtering transaction:', error);
          return false;
        }
      });
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.transactionDate);
        if (dateFilter === 'today') {
          return transactionDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'yesterday') {
          return transactionDate.toDateString() === yesterday.toDateString();
        } else if (dateFilter === 'last7days') {
          return transactionDate >= lastWeek;
        } else if (dateFilter === 'last30days') {
          return transactionDate >= lastMonth;
        }
        return true;
      });
    }

    return filtered;
  };

  // Get filtered transactions
  const filteredTransactions = applyFilters(transactions);

  // Handle pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Pagination controls
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get appropriate display for transaction type
  const getTransactionType = (status: string): string => {
    switch (status) {
      case 'CREDITED':
        return 'Credit';
      case 'DEBITED':
        return 'Debit';
      case 'FREEZED':
        return 'Frozen';
      case 'UNFREEZED':
        return 'Unfrozen';
      case 'COMPLETED':
        return 'COMPLETED';
      default:
        return status;
    }
  };

  // Get appropriate status display and style for transactions
  // UPDATED: All transaction types now show "Success" status
  const getStatusDisplay = (
    status: string,
  ): { text: string; className: string } => {
    // All transaction types show "Success" status
    return {
      text: 'Success',
      className: 'bg-green-100 text-green-800',
    };
  };

  // Handle row selection
  const toggleRowSelection = (transactionId: string) => {
    setSelectedTransactions((prevSelected) => {
      if (prevSelected.includes(transactionId)) {
        return prevSelected.filter((id) => id !== transactionId);
      } else {
        return [...prevSelected, transactionId];
      }
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(currentTransactions.map((t) => t.id));
    }
    setSelectAll(!selectAll);
  };

  // Export selected transactions
  const exportSelectedTransactions = () => {
    // Implementation for exporting selected transactions
    alert(`Exporting ${selectedTransactions.length} transactions`);
  };

  // Reset filters
  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSearchTerm('');
  };

  // Get total and available balance
  const getFrozenBalance = () => {
    if (!walletInfo || !walletInfo.freezeAmount) return 0;
    return Number(walletInfo.freezeAmount);
  };

  const getAvailableBalance = () => {
    if (!walletInfo) return 0;
    return Number(walletInfo.amount);
  };

  const getTotalBalance = () => {
    const available = getAvailableBalance();
    const frozen = getFrozenBalance();
    return available + frozen;
  };

  // Calculate frozen percentage
  const getFrozenPercentage = () => {
    const total = getTotalBalance();
    const frozen = getFrozenBalance();
    if (total === 0 || frozen === 0) return 0;
    return (frozen / total) * 100;
  };

  // Wallet creation UI state
  if (!walletInfo && !isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-normal text-gray-900 mb-4">Wallet</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">
            Access Your Wallet
          </h2>
          <p className="text-yellow-700 mb-4">
            Your wallet should have been created automatically during registration. 
            Click below to access it or create one if it doesn't exist.
          </p>
          {createWalletError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700">
              {createWalletError}
            </div>
          )}
          <button
            onClick={handleCreateWallet}
            className="px-6 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
            disabled={isCreatingWallet}
          >
{isCreatingWallet ? 'Accessing...' : 'Access Wallet'}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !walletInfo) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-normal text-gray-900 mb-4">Wallet</h1>
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Wallet</h1>

      <div className="flex flex-col space-y-4">
        {/* Top section: Main Balance + Available/Frozen Balance */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Main Balance Card */}
          <div className="bg-yellow-300 rounded-lg p-4 md:p-6 w-full md:w-2/5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-800 font-medium">Your Balance</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-3 py-1.5 bg-white text-gray-800 rounded hover:bg-gray-50 transition-colors text-sm"
                  disabled={
                    isLoading || (walletInfo ? getTotalBalance() <= 0 : false)
                  }
                >
                  Withdraw
                </button>
                <button
                  onClick={() => setShowRechargeModal(true)}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors text-sm"
                  disabled={isLoading}
                >
                  Recharge
                </button>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              LKR{' '}
              {getTotalBalance().toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>

          {/* Available and Frozen Balance Section */}
          <div className="flex flex-col md:flex-row gap-0 w-full md:w-3/5">
            <div className="w-full border border-gray-200 rounded-t-lg md:rounded-t-none md:rounded-tl-lg md:rounded-bl-lg p-4 bg-white">
              <div className="text-gray-600 mb-1">Available Balance</div>
              <div className="text-xl font-semibold text-gray-900">
                LKR{' '}
                {getAvailableBalance().toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="w-full border-t-0 md:border-t border-l border-r border-b border-gray-200 rounded-b-lg md:rounded-b-none md:rounded-tr-lg md:rounded-br-lg p-4 bg-white">
              <div className="text-gray-600 mb-1">Frozen Balance</div>
              <div className="text-xl font-semibold text-gray-900">
                LKR{' '}
                {getFrozenBalance().toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </div>
              {getFrozenBalance() > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {getFrozenPercentage().toFixed(1)}% of your balance is frozen
                  for pending bids
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Welcome message for new users with zero balance */}
        {walletInfo && getTotalBalance() === 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex">
            <InfoIcon className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-blue-800 font-medium">
                Welcome to your new wallet!
              </h3>
              <p className="text-blue-700 mt-1">
                Your wallet has been created with a zero balance. You can
                recharge it using the Recharge button above to start bidding on
                auctions.
              </p>
            </div>
          </div>
        )}

        {/* Transactions Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-lg font-medium text-gray-800">Transactions</h2>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search transactions"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-200 rounded pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:border-amber-500"
                />
                <Search className="absolute left-3 top-2 text-gray-400 w-4 h-4" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>

              {selectedTransactions.length > 0 && (
                <button
                  onClick={exportSelectedTransactions}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              )}

              <div className="flex-grow"></div>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            {/* Filter options */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Types</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                    <option value="frozen">Frozen</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <button
                    onClick={resetFilters}
                    className="text-amber-600 hover:text-amber-700 text-sm"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Table */}
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead>
                  <tr className="text-xs text-gray-600 text-left bg-gray-50 border-b border-gray-200">
                    <th className="w-10 p-3 pl-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-20 sm:w-32 p-3 font-medium">ID</th>
                    <th className="w-20 sm:w-24 p-3 font-medium">Date</th>
                    <th className="w-16 sm:w-20 p-3 font-medium">Type</th>
                    <th className="w-16 sm:w-24 p-3 font-medium">Status</th>
                    <th className="w-24 sm:w-40 p-3 font-medium">
                      Description
                    </th>
                    <th className="w-20 sm:w-24 p-3 font-medium text-right">
                      Amount
                    </th>
                    <th className="w-10 p-3"></th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-200">
                  {currentTransactions.map((transaction, index) => {
                    const type = getTransactionType(transaction.status);
                    const status = getStatusDisplay(transaction.status);
                    const isSelected = selectedTransactions.includes(
                      transaction.id,
                    );

                    // Determine the color for the transaction type
                    let typeClassName = '';
                    if (
                      transaction.status === 'CREDITED' ||
                      transaction.status === 'UNFREEZED'
                    ) {
                      typeClassName = 'text-green-600 font-medium';
                    } else if (transaction.status === 'FREEZED') {
                      typeClassName = 'text-amber-600 font-medium';
                    } else if (
                      transaction.status === 'DEBITED' ||
                      transaction.status === 'COMPLETED'
                    ) {
                      typeClassName = 'text-red-600 font-medium';
                    } else {
                      typeClassName = 'text-gray-600 font-medium';
                    }

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-amber-50' : ''} cursor-pointer`}
                        onClick={() => {
                          const type = getTransactionType(transaction.status);
                          setSelectedTransaction({
                            ...transaction,
                            type,
                          });
                          setShowTransactionDetails(true);
                        }}
                      >
                        <td className="p-3 pl-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={isSelected}
                            onChange={() => toggleRowSelection(transaction.id)}
                          />
                        </td>
                        <td
                          className="p-3 font-mono text-xs truncate"
                          title={transaction.id}
                        >
                          {transaction.id.substring(0, 8)}...
                        </td>
                        <td className="p-3">
                          {transaction.transactionDate
                            ? new Date(
                                transaction.transactionDate,
                              ).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="p-3">
                          <span className={typeClassName}>{type}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full ${status.className} text-xs`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td
                          className="p-3 truncate"
                          title={transaction.description || '-'}
                        >
                          {transaction.description
                            ? transaction.description.length > 20
                              ? transaction.description.substring(0, 20) + '...'
                              : transaction.description
                            : '-'}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {Number(transaction.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-3">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls - Simplified */}
          <div className="p-3 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2 text-xs text-gray-600">
            <div className="text-gray-500">
              {selectedTransactions.length} of {filteredTransactions.length}{' '}
              transaction(s) selected
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-7 h-7 rounded border border-gray-200 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center justify-center w-7 h-7 rounded border border-gray-200 ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onRecharge={handleRecharge}
        isLoading={isLoading}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={handleWithdraw}
        maxAmount={getTotalBalance()}
        isLoading={isLoading}
      />

      <TransactionDetailsModal
        isOpen={showTransactionDetails}
        onClose={() => setShowTransactionDetails(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default WalletPage;

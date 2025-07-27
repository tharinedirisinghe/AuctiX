import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface Transaction {
  id: string;
  description?: string;
  status: string;
  transactionDate: string;
  amount: number | string;
  type?: string;
}

interface WalletAnalyticsProps {
  transactions: Transaction[];
  currentBalance: number;
  frozenBalance: number;
}

const WalletAnalytics: React.FC<WalletAnalyticsProps> = ({
  transactions,
  currentBalance,
  frozenBalance,
}) => {
  const analyticsData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        balanceHistory: [],
        transactionTypes: [],
        monthlySpending: [],
        weeklyTrend: [],
        totalCredits: 0,
        totalDebits: 0,
        avgTransactionAmount: 0,
        transactionCount: 0,
      };
    }

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );

    // Calculate balance history
    let runningBalance = 0;
    const balanceHistory = sortedTransactions.map((transaction) => {
      const amount = Number(transaction.amount);

      if (
        transaction.status === 'CREDITED' ||
        transaction.status === 'UNFREEZED'
      ) {
        runningBalance += amount;
      } else if (
        transaction.status === 'DEBITED' ||
        transaction.status === 'COMPLETED'
      ) {
        runningBalance -= amount;
      }

      return {
        date: new Date(transaction.transactionDate).toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
          },
        ),
        balance: runningBalance,
        transaction: amount,
        type: transaction.status,
      };
    });

    // Calculate transaction type distribution
    const typeMap = new Map();
    transactions.forEach((transaction) => {
      const type = transaction.status;
      const amount = Number(transaction.amount);

      if (typeMap.has(type)) {
        typeMap.set(type, {
          ...typeMap.get(type),
          count: typeMap.get(type).count + 1,
          amount: typeMap.get(type).amount + amount,
        });
      } else {
        typeMap.set(type, { count: 1, amount, type });
      }
    });

    const transactionTypes = Array.from(typeMap.values()).map((item) => ({
      name: item.type,
      value: item.count,
      amount: item.amount,
    }));

    // Calculate monthly spending
    const monthlyMap = new Map();
    transactions.forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const amount = Number(transaction.amount);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          credits: 0,
          debits: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey);
      if (
        transaction.status === 'CREDITED' ||
        transaction.status === 'UNFREEZED'
      ) {
        monthData.credits += amount;
      } else if (
        transaction.status === 'DEBITED' ||
        transaction.status === 'COMPLETED'
      ) {
        monthData.debits += amount;
      }
    });

    const monthlySpending = Array.from(monthlyMap.values());

    // Calculate weekly trend (last 7 days)
    const now = new Date();
    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));

      const dayTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.transactionDate);
        return transactionDate.toDateString() === date.toDateString();
      });

      const credits = dayTransactions
        .filter((t) => t.status === 'CREDITED' || t.status === 'UNFREEZED')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const debits = dayTransactions
        .filter((t) => t.status === 'DEBITED' || t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        credits,
        debits,
        net: credits - debits,
      };
    });

    // Calculate summary stats
    const totalCredits = transactions
      .filter((t) => t.status === 'CREDITED' || t.status === 'UNFREEZED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDebits = transactions
      .filter((t) => t.status === 'DEBITED' || t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const avgTransactionAmount =
      transactions.length > 0
        ? transactions.reduce((sum, t) => sum + Number(t.amount), 0) /
          transactions.length
        : 0;

    return {
      balanceHistory,
      transactionTypes,
      monthlySpending,
      weeklyTrend,
      totalCredits,
      totalDebits,
      avgTransactionAmount,
      transactionCount: transactions.length,
    };
  }, [transactions]);

  const COLORS = {
    CREDITED: '#10b981',
    DEBITED: '#ef4444',
    FREEZED: '#f59e0b',
    UNFREEZED: '#06b6d4',
    COMPLETED: '#8b5cf6',
  };

  const getTypeColor = (type: string) =>
    COLORS[type as keyof typeof COLORS] || '#6b7280';

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Wallet Analytics
        </h3>
        <div className="text-center py-8">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            No transaction data available for analysis
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Make some transactions to see your wallet analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Wallet Analytics
        </h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">
                  Total Credits
                </p>
                <p className="text-lg font-bold text-green-700">
                  LKR{' '}
                  {analyticsData.totalCredits.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-900">Total Debits</p>
                <p className="text-lg font-bold text-red-700">
                  LKR{' '}
                  {analyticsData.totalDebits.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  Avg Transaction
                </p>
                <p className="text-lg font-bold text-blue-700">
                  LKR{' '}
                  {analyticsData.avgTransactionAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">
                  Total Transactions
                </p>
                <p className="text-lg font-bold text-purple-700">
                  {analyticsData.transactionCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Balance History
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analyticsData.balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [
                    `LKR ${Number(value).toLocaleString()}`,
                    'Balance',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction Types */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Transaction Distribution
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.transactionTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.transactionTypes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getTypeColor(entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _unused, props) => [
                    `${value} transactions`,
                    props.payload.name,
                  ]}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">
                            {data.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Count:</span>{' '}
                            {data.value} transactions
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Amount:</span> LKR{' '}
                            {data.amount.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              Avg per transaction:
                            </span>{' '}
                            LKR{' '}
                            {(data.amount / data.value).toLocaleString(
                              'en-US',
                              { minimumFractionDigits: 2 },
                            )}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Trend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Weekly Activity
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    `LKR ${Number(value).toLocaleString()}`,
                    name === 'credits'
                      ? 'Credits'
                      : name === 'debits'
                        ? 'Debits'
                        : 'Net',
                  ]}
                />
                <Bar dataKey="credits" fill="#10b981" name="credits" />
                <Bar dataKey="debits" fill="#ef4444" name="debits" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Spending */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Monthly Overview
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analyticsData.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    `LKR ${Number(value).toLocaleString()}`,
                    name === 'credits' ? 'Credits' : 'Debits',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="credits"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="credits"
                />
                <Line
                  type="monotone"
                  dataKey="debits"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="debits"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Insights with Actual Values */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Financial Insights */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-md font-medium text-blue-900 mb-3">
              Financial Analysis
            </h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="flex justify-between">
                <span>Net Cash Flow:</span>
                <span
                  className={`font-semibold ${analyticsData.totalCredits - analyticsData.totalDebits >= 0 ? 'text-green-700' : 'text-red-700'}`}
                >
                  LKR{' '}
                  {(
                    analyticsData.totalCredits - analyticsData.totalDebits
                  ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Balance Utilization:</span>
                <span className="font-semibold">
                  {(
                    (currentBalance / (currentBalance + frozenBalance)) *
                    100
                  ).toFixed(1)}
                  % available
                </span>
              </div>
              <div className="flex justify-between">
                <span>Credit to Debit Ratio:</span>
                <span className="font-semibold">
                  {analyticsData.totalDebits > 0
                    ? (
                        analyticsData.totalCredits / analyticsData.totalDebits
                      ).toFixed(2)
                    : '∞'}{' '}
                  : 1
                </span>
              </div>
              {frozenBalance > 0 && (
                <div className="flex justify-between">
                  <span>Frozen Amount:</span>
                  <span className="font-semibold text-amber-700">
                    LKR{' '}
                    {frozenBalance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Insights */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="text-md font-medium text-green-900 mb-3">
              Activity Insights
            </h4>
            <div className="text-sm text-green-800 space-y-2">
              <div className="flex justify-between">
                <span>Daily Avg Spending:</span>
                <span className="font-semibold">
                  LKR{' '}
                  {(() => {
                    const daysSinceFirst =
                      transactions.length > 0
                        ? Math.max(
                            1,
                            Math.ceil(
                              (new Date().getTime() -
                                new Date(
                                  transactions[0].transactionDate,
                                ).getTime()) /
                                (1000 * 60 * 60 * 24),
                            ),
                          )
                        : 1;
                    return (
                      analyticsData.totalDebits / daysSinceFirst
                    ).toLocaleString('en-US', { minimumFractionDigits: 2 });
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Most Active Type:</span>
                <span className="font-semibold">
                  {(() => {
                    const maxType = analyticsData.transactionTypes.reduce(
                      (max, type) => (type.value > max.value ? type : max),
                      { name: 'None', value: 0 },
                    );
                    return maxType.name;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Weekly Activity:</span>
                <span className="font-semibold">
                  {(() => {
                    const weeklyTotal = analyticsData.weeklyTrend.reduce(
                      (sum, day) => sum + day.credits + day.debits,
                      0,
                    );
                    return `LKR ${weeklyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Frequency:</span>
                <span className="font-semibold">
                  {(() => {
                    const daysSinceFirst =
                      transactions.length > 0
                        ? Math.max(
                            1,
                            Math.ceil(
                              (new Date().getTime() -
                                new Date(
                                  transactions[0].transactionDate,
                                ).getTime()) /
                                (1000 * 60 * 60 * 24),
                            ),
                          )
                        : 1;
                    return `${(analyticsData.transactionCount / daysSinceFirst).toFixed(1)}/day`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Patterns */}
        <div className="mt-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="text-md font-medium text-purple-900 mb-3">
            Spending Patterns
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-purple-800">
              <div className="font-medium mb-1">Largest Transaction</div>
              <div className="text-lg font-bold">
                LKR{' '}
                {(() => {
                  const maxTransaction = transactions.reduce(
                    (max, t) =>
                      Number(t.amount) > Number(max.amount) ? t : max,
                    transactions[0],
                  );
                  return Number(maxTransaction.amount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  });
                })()}
              </div>
            </div>
            <div className="text-purple-800">
              <div className="font-medium mb-1">Average per Month</div>
              <div className="text-lg font-bold">
                LKR{' '}
                {(() => {
                  const monthsActive = Math.max(
                    1,
                    new Set(
                      transactions.map((t) =>
                        new Date(t.transactionDate).toISOString().slice(0, 7),
                      ),
                    ).size,
                  );
                  return (
                    analyticsData.totalDebits / monthsActive
                  ).toLocaleString('en-US', { minimumFractionDigits: 2 });
                })()}
              </div>
            </div>
            <div className="text-purple-800">
              <div className="font-medium mb-1">Balance Efficiency</div>
              <div className="text-lg font-bold">
                {(() => {
                  const totalBalance = currentBalance + frozenBalance;
                  const efficiency =
                    totalBalance > 0
                      ? (currentBalance / totalBalance) * 100
                      : 0;
                  return `${efficiency.toFixed(1)}%`;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="text-md font-medium text-amber-900 mb-3">
            Trend Analysis
          </h4>
          <div className="text-sm text-amber-800 space-y-2">
            <div className="flex justify-between">
              <span>Recent Activity (7 days):</span>
              <span className="font-semibold">
                {(() => {
                  const recentTransactions = transactions.filter((t) => {
                    const transactionDate = new Date(t.transactionDate);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return transactionDate >= sevenDaysAgo;
                  });
                  return `${recentTransactions.length} transactions`;
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Balance Growth:</span>
              <span
                className={`font-semibold ${analyticsData.totalCredits - analyticsData.totalDebits >= 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                {(() => {
                  const growth =
                    ((analyticsData.totalCredits - analyticsData.totalDebits) /
                      Math.max(1, analyticsData.totalCredits)) *
                    100;
                  return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Spending Consistency:</span>
              <span className="font-semibold">
                {(() => {
                  const monthlyAmounts = analyticsData.monthlySpending.map(
                    (m) => m.debits,
                  );
                  if (monthlyAmounts.length < 2) return 'Insufficient data';
                  const avg =
                    monthlyAmounts.reduce((sum, amt) => sum + amt, 0) /
                    monthlyAmounts.length;
                  const variance =
                    monthlyAmounts.reduce(
                      (sum, amt) => sum + Math.pow(amt - avg, 2),
                      0,
                    ) / monthlyAmounts.length;
                  const consistency =
                    variance < avg * 0.5
                      ? 'High'
                      : variance < avg
                        ? 'Medium'
                        : 'Low';
                  return consistency;
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletAnalytics;

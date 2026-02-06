// ============================================
// TRANSACTION HISTORY COMPONENT
// ============================================
// Displays full transaction history with filtering and search

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, Calendar, DollarSign, ArrowUpDown, Download, X } from 'lucide-react';
import { Card, CardHeader, Badge, Button } from '@/components/ui';
import { useCareerStore } from '@/store/careerStore';

type SortField = 'date' | 'amount' | 'category' | 'type';
type SortDirection = 'asc' | 'desc';

interface TransactionHistoryProps {
  currentWeek: number;
  currentYear: number;
}

export function TransactionHistory({ currentWeek, currentYear }: TransactionHistoryProps) {
  const [weekRange, setWeekRange] = useState<{ start: number; end: number }>({
    start: 1, 
    end: currentWeek 
  })
  const [yearFilter, setYearFilter] = useState<number>(currentYear)
  
  // Sort state
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 20
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]
    
    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(tx => tx.type === typeFilter)
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(tx => tx.category === categoryFilter)
    }
    
    // Year filter
    result = result.filter(tx => tx.year === yearFilter)
    
    // Week range filter
    result = result.filter(tx => tx.week >= weekRange.start && tx.week <= weekRange.end)
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(tx => 
        tx.description.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'date':
          // Sort by year, then week
          comparison = (a.year * 100 + a.week) - (b.year * 100 + b.week)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }
      
      return sortDirection === 'desc' ? -comparison : comparison
    })
    
    return result
  }, [transactions, typeFilter, categoryFilter, searchQuery, weekRange, yearFilter, sortField, sortDirection])
  
  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )
  
  // Summary stats
  const summaryStats = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const expenses = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    return {
      income,
      expenses,
      net: income - expenses,
      count: filteredTransactions.length
    }
  }, [filteredTransactions])
  
  // Get unique categories from transactions
  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map(tx => tx.category))
    return Array.from(categories)
  }, [transactions])
  
  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(tx => tx.year))
    return Array.from(years).sort((a, b) => b - a)
  }, [transactions])
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }
  
  const handleExport = () => {
    // Generate CSV content
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount']
    const rows = filteredTransactions.map(tx => [
      `Week ${tx.week}, ${tx.year}`,
      tx.type,
      CATEGORY_LABELS[tx.category],
      tx.description,
      tx.type === 'income' ? tx.amount : -tx.amount
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${yearFilter}_week${weekRange.start}-${weekRange.end}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Transaction History" 
        subtitle={`${summaryStats.count} transactions`}
        action={
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-surface rounded-lg">
          <p className="text-xs text-text-muted">Total Income</p>
          <p className="font-mono font-bold text-status-success">
            +{formatCurrency(summaryStats.income)}
          </p>
        </div>
        <div className="p-3 bg-surface rounded-lg">
          <p className="text-xs text-text-muted">Total Expenses</p>
          <p className="font-mono font-bold text-status-danger">
            -{formatCurrency(summaryStats.expenses)}
          </p>
        </div>
        <div className="p-3 bg-surface rounded-lg">
          <p className="text-xs text-text-muted">Net Change</p>
          <p className={`font-mono font-bold ${
            summaryStats.net >= 0 ? 'text-status-success' : 'text-status-danger'
          }`}>
            {summaryStats.net >= 0 ? '+' : ''}{formatCurrency(summaryStats.net)}
          </p>
        </div>
        <div className="p-3 bg-surface rounded-lg">
          <p className="text-xs text-text-muted">Transactions</p>
          <p className="font-mono font-bold">{summaryStats.count}</p>
        </div>
      </div>
      
      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 p-4 bg-surface rounded-lg overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="col-span-2">
                <label className="text-xs text-text-muted mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 bg-background rounded-lg border border-surface-border text-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Type Filter */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                  className="w-full px-3 py-2 bg-background rounded-lg border border-surface-border text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as TeamTransactionCategory | 'all')}
                  className="w-full px-3 py-2 bg-background rounded-lg border border-surface-border text-sm"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              
              {/* Year Filter */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-background rounded-lg border border-surface-border text-sm"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {/* Week Range */}
              <div className="col-span-2 lg:col-span-3">
                <label className="text-xs text-text-muted mb-1 block">
                  Week Range: {weekRange.start} - {weekRange.end}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={52}
                    value={weekRange.start}
                    onChange={(e) => setWeekRange(prev => ({ ...prev, start: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-text-muted">to</span>
                  <input
                    type="range"
                    min={1}
                    max={52}
                    value={weekRange.end}
                    onChange={(e) => setWeekRange(prev => ({ ...prev, end: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-surface rounded-t-lg text-xs text-text-muted font-medium">
        <button 
          className="col-span-2 flex items-center gap-1 hover:text-text-primary"
          onClick={() => handleSort('date')}
        >
          <Calendar className="w-3 h-3" />
          Date
          {sortField === 'date' && (
            sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
          )}
        </button>
        <button 
          className="col-span-2 flex items-center gap-1 hover:text-text-primary"
          onClick={() => handleSort('category')}
        >
          <Tag className="w-3 h-3" />
          Category
          {sortField === 'category' && (
            sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
          )}
        </button>
        <div className="col-span-5">Description</div>
        <button 
          className="col-span-3 flex items-center justify-end gap-1 hover:text-text-primary"
          onClick={() => handleSort('amount')}
        >
          Amount
          {sortField === 'amount' && (
            sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
          )}
        </button>
      </div>
      
      {/* Transaction Rows */}
      <div className="divide-y divide-surface-border">
        {paginatedTransactions.length === 0 ? (
          <div className="py-8 text-center text-text-muted">
            No transactions found matching your filters
          </div>
        ) : (
          paginatedTransactions.map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-surface/50 transition-colors"
            >
              <div className="col-span-2 text-sm text-text-muted">
                Week {tx.week}, {tx.year}
              </div>
              <div className={`col-span-2 text-sm flex items-center gap-2 ${CATEGORY_COLORS[tx.category]}`}>
                {tx.type === 'income' ? (
                  <ArrowUpCircle className="w-4 h-4 text-status-success" />
                ) : (
                  <ArrowDownCircle className="w-4 h-4 text-status-danger" />
                )}
                {CATEGORY_LABELS[tx.category]}
              </div>
              <div className="col-span-5 text-sm truncate" title={tx.description}>
                {tx.description}
              </div>
              <div className={`col-span-3 text-sm font-mono text-right ${
                tx.type === 'income' ? 'text-status-success' : 'text-status-danger'
              }`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-border">
          <p className="text-sm text-text-muted">
            Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-text-muted">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

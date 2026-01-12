import React, { useState } from 'react';

export interface AnalyticsFilters {
  dateRange: '7d' | '30d' | '90d' | 'all' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  questionIds?: number[];
  countries?: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  conditionalPaths?: string[];
}

interface FilterPanelProps {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  questions: Array<{ id: number; question_text: string }>;
  availableCountries?: string[];
  availableUtmSources?: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  questions,
  availableCountries = [],
  availableUtmSources = []
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateFilter = (key: keyof AnalyticsFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleQuestion = (questionId: number) => {
    const current = filters.questionIds || [];
    const updated = current.includes(questionId)
      ? current.filter(id => id !== questionId)
      : [...current, questionId];
    updateFilter('questionIds', updated.length > 0 ? updated : undefined);
  };

  const toggleCountry = (country: string) => {
    const current = filters.countries || [];
    const updated = current.includes(country)
      ? current.filter(c => c !== country)
      : [...current, country];
    updateFilter('countries', updated.length > 0 ? updated : undefined);
  };

  const activeFiltersCount = [
    filters.questionIds?.length || 0,
    filters.countries?.length || 0,
    filters.utmSource ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  // Determine which UTM sources to show
  const utmSourcesToShow = availableUtmSources.length > 0 
    ? ['Organic', ...availableUtmSources] 
    : ['Organic'];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none',
          transition: 'all 0.15s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: '700',
            color: '#111827',
            letterSpacing: '-0.01em'
          }}>
            Filters
          </span>
          {activeFiltersCount > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#9333ea',
              background: 'rgba(147, 51, 234, 0.1)',
              padding: '3px 10px',
              borderRadius: '12px'
            }}>
              {activeFiltersCount} active
            </span>
          )}
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Date Range */}
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '10px'
            }}>
              Date Range
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: filters.dateRange === 'custom' ? '12px' : '0' }}>
              {[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
                { value: 'all', label: 'This Month' },
                { value: 'custom', label: 'Custom Range' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('dateRange', option.value)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: filters.dateRange === option.value ? 'white' : '#374151',
                    background: filters.dateRange === option.value ? '#9333ea' : '#f9fafb',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (filters.dateRange !== option.value) {
                      e.currentTarget.style.background = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.dateRange !== option.value) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom Date Picker */}
            {filters.dateRange === 'custom' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="date"
                    value={filters.customStartDate || ''}
                    onChange={(e) => updateFilter('customStartDate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      border: '2px solid #f3f4f6',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#111827',
                      fontWeight: '500',
                      transition: 'all 0.15s',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#f3f4f6'}
                  />
                </div>
                <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>to</span>
                <div style={{ flex: 1 }}>
                  <input
                    type="date"
                    value={filters.customEndDate || ''}
                    onChange={(e) => updateFilter('customEndDate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      border: '2px solid #f3f4f6',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#111827',
                      fontWeight: '500',
                      transition: 'all 0.15s',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#9333ea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#f3f4f6'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Questions */}
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '10px'
            }}>
              Questions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {questions.slice(0, 5).map((q) => {
                const isActive = filters.questionIds?.includes(q.id) || false;
                const label = q.question_text.substring(0, 20);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: isActive ? 'white' : '#374151',
                      background: isActive ? '#9333ea' : '#f9fafb',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                  >
                    {label}...
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country */}
          {availableCountries.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '10px'
              }}>
                Country
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableCountries.slice(0, 7).map(country => {
                  const isActive = filters.countries?.includes(country) || false;
                  return (
                    <button
                      key={country}
                      onClick={() => toggleCountry(country)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: isActive ? 'white' : '#374151',
                        background: isActive ? '#9333ea' : '#f9fafb',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                    >
                      {country}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* UTM Source - Only show if there are sources */}
          {utmSourcesToShow.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '10px'
              }}>
                UTM Source
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {utmSourcesToShow.map((source) => {
                  const isActive = filters.utmSource?.toLowerCase() === source.toLowerCase() || 
                                   (!filters.utmSource && source.toLowerCase() === 'organic');
                  return (
                    <button
                      key={source}
                      onClick={() => updateFilter('utmSource', isActive ? undefined : source.toLowerCase())}
                      style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: isActive ? 'white' : '#374151',
                        background: isActive ? '#9333ea' : '#f9fafb',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                    >
                      {source}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear Filters Link */}
          {activeFiltersCount > 0 && (
            <div style={{ marginTop: '4px' }}>
              <button
                onClick={() => onChange({ dateRange: '30d' })}
                style={{
                  padding: 0,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#9333ea',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

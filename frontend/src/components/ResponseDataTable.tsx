import React, { useState, useMemo, useEffect } from 'react';

interface ResponseDataTableProps {
  columns: string[];
  rows: Record<string, any>[];
  rowCount?: number;
  maxHeight?: string;
}

type ViewMode = 'table' | 'chart' | 'sankey';

/**
 * Analytics-style data table and chart for displaying response data in chat.
 * Features:
 * - Toggle between table and chart view
 * - Bar chart for aggregated data
 * - Purple accent styling
 * - Responsive design
 */
export const ResponseDataTable: React.FC<ResponseDataTableProps> = ({
  columns,
  rows,
  rowCount,
  maxHeight = '300px'
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Detect if data looks like category counts (should default to chart view)
  const looksLikeCategoryCounts = useMemo(() => {
    if (!rows || rows.length === 0 || columns.length < 2) return false;
    
    const colsLower = columns.map(c => c.toLowerCase());
    // Check if we have a label + count pattern
    const hasCountCol = colsLower.some(c => c.includes('count') || c === 'total' || c === 'responses');
    const hasLabelCol = colsLower.some(c => 
      c.includes('option') || c.includes('rating') || c.includes('status') || 
      c.includes('satisfaction') || c.includes('category') || c.includes('choice')
    );
    
    // Or if all values in second column are numbers (counts)
    const secondColAllNumbers = rows.every(r => {
      const val = r[columns[1]];
      return typeof val === 'number' || !isNaN(parseFloat(val));
    });
    
    return (hasCountCol || hasLabelCol || secondColAllNumbers) && rows.length >= 2 && rows.length <= 15;
  }, [rows, columns]);

  // Detect if data is chartable (has numeric columns for aggregation)
  const chartData = useMemo(() => {
    if (!rows || rows.length === 0 || columns.length < 2) return null;

    // Find numeric column (count, sum, avg, etc.)
    const numericCols = columns.filter(col => {
      const colLower = col.toLowerCase();
      return colLower.includes('count') || 
             colLower.includes('sum') || 
             colLower.includes('avg') || 
             colLower.includes('average') ||
             colLower.includes('total') ||
             colLower.includes('rating') ||
             colLower.includes('responses');
    });

    // Also check if second column is all numbers (for generic count queries)
    if (numericCols.length === 0 && columns.length >= 2) {
      const secondColAllNumbers = rows.every(r => {
        const val = r[columns[1]];
        return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)));
      });
      if (secondColAllNumbers) {
        numericCols.push(columns[1]);
      }
    }

    // Find label column (first non-numeric column)
    const labelCol = columns.find(col => !numericCols.includes(col)) || columns[0];
    const valueCol = numericCols[0] || columns[1];

    if (!labelCol || !valueCol) return null;

    // Extract chart data
    const data = rows.map(row => ({
      label: String(row[labelCol] || 'Unknown'),
      value: parseFloat(row[valueCol]) || 0
    })).filter(d => !isNaN(d.value));

    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));

    return {
      data,
      maxValue,
      labelCol,
      valueCol
    };
  }, [rows, columns]);

  const isChartable = chartData !== null && chartData.data.length > 0 && chartData.data.length <= 20;

  // Detect if data looks like checkbox combinations (has comma-separated values in label column)
  const isCombinationData = useMemo(() => {
    if (!chartData || chartData.data.length < 2) return false;
    
    const colLower = chartData.labelCol.toLowerCase();
    const hasCombinationKeyword = colLower.includes('combination') || colLower.includes('features') || 
                                   colLower.includes('options') || colLower.includes('selected');
    
    // Check if most labels contain commas (indicating multiple selections)
    const labelsWithCommas = chartData.data.filter(d => d.label.includes(', ')).length;
    const hasMultipleSelections = labelsWithCommas > chartData.data.length * 0.3;
    
    return hasCombinationKeyword || hasMultipleSelections;
  }, [chartData]);

  // Parse combinations into Sankey-style flow data
  const sankeyData = useMemo(() => {
    if (!chartData || !isCombinationData) return null;
    
    // Get all unique options across all combinations
    const allOptions = new Set<string>();
    chartData.data.forEach(d => {
      d.label.split(', ').forEach(opt => allOptions.add(opt.trim()));
    });
    const optionsList = Array.from(allOptions).sort();
    
    // Calculate total for percentages
    const total = chartData.data.reduce((sum, d) => sum + d.value, 0);
    
    // Build flow data: for each combination, create connections
    const flows: Array<{ combination: string; options: string[]; count: number; percentage: number }> = 
      chartData.data.map(d => ({
        combination: d.label,
        options: d.label.split(', ').map(o => o.trim()),
        count: d.value,
        percentage: (d.value / total) * 100
      })).sort((a, b) => b.count - a.count);
    
    return {
      options: optionsList,
      flows,
      total,
      maxCount: Math.max(...flows.map(f => f.count))
    };
  }, [chartData, isCombinationData]);

  // Auto-switch view based on data type
  useEffect(() => {
    if (isCombinationData && sankeyData) {
      setViewMode('sankey');
    } else if (looksLikeCategoryCounts) {
      setViewMode('chart');
    }
  }, [looksLikeCategoryCounts, isCombinationData, sankeyData]);

  // Format column header for display
  const formatColumnHeader = (col: string): string => {
    // Convert q1_some_text to "Some Text"
    if (col.startsWith('q') && col.includes('_')) {
      const parts = col.split('_').slice(1); // Remove q1_ prefix
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    // Convert snake_case to Title Case
    return col.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // Format cell value
  const formatCellValue = (value: any, column: string): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>;
    }

    // Status badge
    if (column === 'status') {
      const isComplete = value === 'complete';
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          background: isComplete ? '#ecfdf5' : '#fef3c7',
          color: isComplete ? '#059669' : '#d97706'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isComplete ? '#10b981' : '#f59e0b'
          }} />
          {isComplete ? 'Complete' : 'Partial'}
        </span>
      );
    }

    // Timestamp formatting
    if (column === 'submitted_at' && typeof value === 'string') {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return value;
      }
    }

    // Truncate long text
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 47)}...
        </span>
      );
    }

    return String(value);
  };

  // Bar Chart Component
  const BarChart = () => {
    if (!chartData) return null;
    
    const { data, maxValue, labelCol, valueCol } = chartData;
    const barColors = ['#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'];
    
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {formatColumnHeader(valueCol)} by {formatColumnHeader(labelCol)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '100px',
                fontSize: '13px',
                color: '#374151',
                fontWeight: '500',
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={item.label}>
                {item.label}
              </div>
              <div style={{
                flex: 1,
                height: '28px',
                background: '#f3f4f6',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${barColors[idx % barColors.length]} 0%, ${barColors[(idx + 1) % barColors.length]} 100%)`,
                  borderRadius: '6px',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px',
                  minWidth: item.value > 0 ? '40px' : '0'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {Number.isInteger(item.value) ? item.value : item.value.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary stats */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#faf5ff',
          borderRadius: '8px',
          display: 'flex',
          gap: '24px',
          fontSize: '13px'
        }}>
          <div>
            <span style={{ color: '#6b7280' }}>Total: </span>
            <strong style={{ color: '#9333ea' }}>
              {data.reduce((sum, d) => sum + d.value, 0).toFixed(Number.isInteger(data[0]?.value) ? 0 : 2)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Average: </span>
            <strong style={{ color: '#9333ea' }}>
              {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Max: </span>
            <strong style={{ color: '#9333ea' }}>
              {maxValue.toFixed(Number.isInteger(maxValue) ? 0 : 2)}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  // Sankey-style Combination Chart Component
  const SankeyChart = () => {
    if (!sankeyData) return null;
    
    const { options, flows, total, maxCount } = sankeyData;
    const colors = ['#9333ea', '#7c3aed', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    
    // Assign colors to each option
    const optionColors: Record<string, string> = {};
    options.forEach((opt, idx) => {
      optionColors[opt] = colors[idx % colors.length];
    });
    
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Selection Combinations ({total} responses)
        </div>
        
        {/* Option legend */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {options.map((opt, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: '#f9fafb',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: optionColors[opt]
              }} />
              {opt}
            </div>
          ))}
        </div>
        
        {/* Sankey-style flows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {flows.slice(0, 10).map((flow, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Combination visualization */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap'
              }}>
                {flow.options.map((opt, optIdx) => (
                  <React.Fragment key={optIdx}>
                    {optIdx > 0 && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                    <span style={{
                      padding: '4px 10px',
                      background: `${optionColors[opt]}15`,
                      border: `2px solid ${optionColors[opt]}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: optionColors[opt],
                      whiteSpace: 'nowrap'
                    }}>
                      {opt}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              
              {/* Flow bar */}
              <div style={{
                width: '150px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  flex: 1,
                  height: '24px',
                  background: '#f3f4f6',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(flow.count / maxCount) * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${flow.options.map(o => optionColors[o]).join(', ')})`,
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#374151',
                  minWidth: '50px',
                  textAlign: 'right'
                }}>
                  {flow.count} <span style={{ fontWeight: '400', color: '#9ca3af', fontSize: '11px' }}>({flow.percentage.toFixed(0)}%)</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {flows.length > 10 && (
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#9ca3af',
            fontStyle: 'italic'
          }}>
            Showing top 10 of {flows.length} combinations
          </div>
        )}
        
        {/* Summary */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#faf5ff',
          borderRadius: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '13px'
        }}>
          <div>
            <span style={{ color: '#6b7280' }}>Unique Combinations: </span>
            <strong style={{ color: '#9333ea' }}>{flows.length}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Total Responses: </span>
            <strong style={{ color: '#9333ea' }}>{total}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Most Common: </span>
            <strong style={{ color: '#9333ea' }}>{flows[0]?.combination || '-'}</strong>
          </div>
        </div>
      </div>
    );
  };

  if (!rows || rows.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '14px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        No data to display
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      overflow: 'hidden',
      background: '#ffffff'
    }}>
      {/* View Toggle */}
      {(isChartable || isCombinationData) && (
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid #e5e7eb',
          background: '#faf5ff',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: viewMode === 'table' ? 'white' : '#6b7280',
              background: viewMode === 'table' ? '#9333ea' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            Table
          </button>
          <button
            onClick={() => setViewMode('chart')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: viewMode === 'chart' ? 'white' : '#6b7280',
              background: viewMode === 'chart' ? '#9333ea' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Chart
          </button>
          {isCombinationData && (
            <button
              onClick={() => setViewMode('sankey')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: viewMode === 'sankey' ? 'white' : '#6b7280',
                background: viewMode === 'sankey' ? '#9333ea' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h4l3 6-3 6H3" />
                <path d="M14 6h4l3 6-3 6h-4" />
                <path d="M7 9h7" />
                <path d="M7 15h7" />
              </svg>
              Flow
            </button>
          )}
        </div>
      )}

      {/* Sankey View */}
      {viewMode === 'sankey' && isCombinationData ? (
        <SankeyChart />
      ) : viewMode === 'chart' && isChartable ? (
        /* Chart View */
        <BarChart />
      ) : (
        /* Table View */
        <div style={{
          maxHeight,
          overflowY: 'auto',
          overflowX: 'auto'
        }}>
          <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px'
        }}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#9333ea',
                    background: '#faf5ff',
                    borderBottom: '2px solid #e9d5ff',
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  {formatColumnHeader(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  background: rowIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3e8ff'}
                onMouseLeave={(e) => e.currentTarget.style.background = rowIdx % 2 === 0 ? '#ffffff' : '#fafafa'}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f3f4f6',
                      color: '#374151',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {formatCellValue(row[col], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      
      {/* Footer with row count */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <span>
          <strong style={{ color: '#9333ea' }}>{rowCount || rows.length}</strong> {(rowCount || rows.length) === 1 ? 'row' : 'rows'}
        </span>
        {rows.length < (rowCount || rows.length) && (
          <span style={{ fontStyle: 'italic' }}>
            Showing first {rows.length} of {rowCount}
          </span>
        )}
      </div>
    </div>
  );
};

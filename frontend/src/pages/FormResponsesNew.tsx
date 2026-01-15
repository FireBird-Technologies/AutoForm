import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config, getAuthHeaders } from '../config';

interface Response {
  id: number;
  submitted_at: string;
  status: string;
  ip_address?: string;
  country?: string;
  answers: Array<{
    question_id: number;
    question_text: string;
    answer_value: any;
  }>;
}

interface FormData {
  id: number;
  title: string;
  questions: Array<{
    id: number;
    question_text: string;
    question_type: string;
  }>;
}

export const FormResponsesNew: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'complete' | 'partial'>('all');
  
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadForm();
  }, [formId]);

  useEffect(() => {
    if (formData) {
      loadResponses();
    }
  }, [formId, currentPage, formData]);

  const loadForm = async () => {
    try {
      const res = await fetch(`${config.backendUrl}/api/forms/${formId}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to load form');
      const data = await res.json();
      setFormData(data);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.backendUrl}/api/forms/${formId}/responses`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load responses');
      }

      const data = await response.json();
      
      // Sort by most recent first
      const sortedResponses = (data.responses || []).sort((a: Response, b: Response) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
      
      setResponses(sortedResponses);
      setTotalCount(sortedResponses.length);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formId}/responses/export/${format}`,
        {
          headers: getAuthHeaders(),
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${formId}_responses.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export: ' + err.message);
    }
  };

  const formatAnswer = (value: any): React.ReactNode => {
    if (!value) return '-';
    
    if (value.files && Array.isArray(value.files)) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {value.files.map((file: any, idx: number) => {
            const label = file?.filename || file?.original_filename || file?.s3_key || `File ${idx + 1}`;
            if (file?.download_url || file?.s3_url || file?.url) {
              const downloadUrl = file?.download_url || file?.s3_url || file?.url;
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(downloadUrl, '_blank');
                  }}
                  title={`Download ${label}`}
                  style={{
                    padding: '6px 12px',
                    background: '#9333ea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                    boxShadow: '0 1px 3px rgba(147,51,234,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#7e22ce';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(147,51,234,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#9333ea';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(147,51,234,0.3)';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  {label.length > 15 ? label.substring(0, 15) + '...' : label}
                </button>
              );
            }
            return (
              <span key={idx} style={{ fontSize: '13px', color: '#6b7280' }}>
                {label}
              </span>
            );
          })}
        </div>
      );
    }

    if (value.text) return value.text;
    if (value.file_url || value.s3_url || value.url) {
      const downloadUrl = value.file_url || value.s3_url || value.url;
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(downloadUrl, '_blank');
          }}
          title="Download file"
          style={{
            padding: '6px 12px',
            background: '#9333ea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s',
            boxShadow: '0 1px 3px rgba(147,51,234,0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7e22ce';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(147,51,234,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#9333ea';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(147,51,234,0.3)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Download File
        </button>
      );
    }
    if (value.number !== undefined && value.number !== null) return value.number.toString();
    if (value.choices) return Array.isArray(value.choices) ? value.choices.join(', ') : String(value.choices);
    if (value.date) return value.date;
    if (value.rating) return `${'⭐'.repeat(value.rating)}`;
    if (value.matrix_answers) {
      return Object.entries(value.matrix_answers)
        .map(([row, col]) => `${row}: ${col}`)
        .join('; ');
    }
    if (value.ranked_items && Array.isArray(value.ranked_items)) return value.ranked_items.join(' → ');
    if (value.wallet_address) return value.wallet_address;
    
    // Handle null/undefined values
    if (value === null || value === undefined) return '-';
    
    // Fallback for other types
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  // Filter responses by status
  const filteredResponses = responses.filter(response => {
    if (activeTab === 'all') return true;
    if (activeTab === 'complete') return response.status === 'complete';
    if (activeTab === 'partial') return response.status === 'partial' || response.status === 'in_progress';
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResponses = filteredResponses.slice(startIndex, endIndex);

  if (loading && !formData) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #f3f4f6',
          borderTop: '3px solid #9333ea',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            background: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: '500', marginBottom: '24px' }}>
            {error}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 28px',
              background: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'transform 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      background: '#fafafa',
      padding: '24px',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: '40px',
                height: '40px',
                background: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 4px 0',
                letterSpacing: '-0.02em'
              }}>
                Responses
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0,
                fontWeight: '500'
              }}>
                {formData?.title}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#6b7280',
              padding: '10px 16px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {totalCount} {totalCount === 1 ? 'Response' : 'Responses'}
            </div>
            <button
              onClick={() => handleExport('csv')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                background: '#9333ea',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7e22ce';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#9333ea';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ↓ Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#6b7280',
                background: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ↓ Export JSON
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'inline-flex',
          gap: '4px'
        }}>
          {[
            { key: 'all' as const, label: 'All', count: responses.length },
            { key: 'complete' as const, label: 'Complete', count: responses.filter(r => r.status === 'complete').length },
            { key: 'partial' as const, label: 'Partial', count: responses.filter(r => r.status === 'partial' || r.status === 'in_progress').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: activeTab === tab.key ? '#9333ea' : '#6b7280',
                background: activeTab === tab.key ? '#f3e8ff' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background: activeTab === tab.key ? '#9333ea' : '#e5e7eb',
                color: activeTab === tab.key ? 'white' : '#6b7280'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {filteredResponses.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '80px 40px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              opacity: 0.5
            }}>
              📝
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {activeTab === 'all' ? 'No Responses Yet' : `No ${activeTab === 'complete' ? 'Complete' : 'Partial'} Responses`}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {activeTab === 'all' 
                ? 'Publish your form to start collecting responses' 
                : `There are no ${activeTab} responses for this form`}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #e5e7eb'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>
                <thead>
                  <tr style={{
                    background: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      left: 0,
                      background: '#f9fafb',
                      zIndex: 10,
                      borderRight: '1px solid #e5e7eb'
                    }}>
                      Submitted at
                    </th>
                    {formData?.questions.map((question) => (
                      <th
                        key={question.id}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '12px',
                          minWidth: '200px',
                          maxWidth: '300px',
                          whiteSpace: 'normal',
                          lineHeight: '1.4'
                        }}
                      >
                        {question.question_text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedResponses.map((response, idx) => (
                    <tr
                      key={response.id}
                      style={{
                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
                    >
                      <td style={{
                        padding: '12px 16px',
                        fontWeight: '500',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        position: 'sticky',
                        left: 0,
                        background: 'inherit',
                        zIndex: 5,
                        borderRight: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {activeTab === 'all' && response.status !== 'complete' && (
                            <span
                              title="Partial response"
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#f59e0b',
                                display: 'inline-block'
                              }}
                            />
                          )}
                          <span>
                            {new Date(response.submitted_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {' '}
                            {new Date(response.submitted_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      {formData?.questions.map((question) => {
                        const answer = response.answers.find((a) => a.question_id === question.id);
                        return (
                          <td
                            key={question.id}
                            style={{
                              padding: '12px 16px',
                              color: '#374151',
                              verticalAlign: 'top',
                              maxWidth: '300px',
                              overflow: 'hidden'
                            }}
                          >
                            {answer ? formatAnswer(answer.answer_value) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                padding: '20px 24px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredResponses.length)} of {filteredResponses.length}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentPage === 1 ? '#d1d5db' : '#374151',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.borderColor = '#9333ea';
                        e.currentTarget.style.color = '#9333ea';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            width: '40px',
                            height: '40px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: currentPage === pageNum ? 'white' : '#374151',
                            background: currentPage === pageNum ? '#9333ea' : 'white',
                            border: '1px solid',
                            borderColor: currentPage === pageNum ? '#9333ea' : '#e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            if (currentPage !== pageNum) {
                              e.currentTarget.style.borderColor = '#9333ea';
                              e.currentTarget.style.color = '#9333ea';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (currentPage !== pageNum) {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.color = '#374151';
                            }
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentPage === totalPages ? '#d1d5db' : '#374151',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.borderColor = '#9333ea';
                        e.currentTarget.style.color = '#9333ea';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedResponse(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.01em'
                }}>
                  Response #{selectedResponse.id}
                </h2>
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {new Date(selectedResponse.submitted_at).toLocaleString()}
                  {selectedResponse.country && ` • ${selectedResponse.country}`}
                </div>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  fontSize: '24px',
                  color: '#6b7280',
                  background: '#f9fafb',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {selectedResponse.answers.map((answer, index) => (
                <div key={index} style={{
                  padding: '20px',
                  background: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #f3f4f6'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#9333ea',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Question {index + 1}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px',
                    lineHeight: '1.5'
                  }}>
                    {answer.question_text}
                  </div>
                  <div style={{
                    padding: '14px 16px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: '500',
                    border: '1px solid #e5e7eb'
                  }}>
                    {formatAnswer(answer.answer_value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

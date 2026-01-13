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

  const formatAnswer = (value: any): string => {
    if (!value) return '-';
    
    if (value.text) return value.text;
    if (value.number !== undefined) return value.number.toString();
    if (value.choices) return Array.isArray(value.choices) ? value.choices.join(', ') : String(value.choices);
    if (value.date) return value.date;
    if (value.rating) return `${'⭐'.repeat(value.rating)}`;
    if (value.matrix_answers) {
      return Object.entries(value.matrix_answers)
        .map(([row, col]) => `${row}: ${col}`)
        .join('; ');
    }
    if (value.ranked_items) return value.ranked_items.join(' → ');
    if (value.wallet_address) return value.wallet_address;
    
    return String(value);
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResponses = responses.slice(startIndex, endIndex);

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

        {/* Table */}
        {responses.length === 0 ? (
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
              No Responses Yet
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Publish your form to start collecting responses
            </p>
          </div>
        ) : (
          <>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 180px 120px 1fr 150px',
                padding: '16px 24px',
                background: '#fafafa',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '12px',
                fontWeight: '700',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div>ID</div>
                <div>Submitted</div>
                <div>Status</div>
                <div>Location</div>
                <div>Answers</div>
              </div>

              {/* Table Body */}
              {paginatedResponses.map((response) => (
                <div
                  key={response.id}
                  onClick={() => setSelectedResponse(response)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 180px 120px 1fr 150px',
                    padding: '18px 24px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#9333ea'
                  }}>
                    #{response.id}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {new Date(response.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    <br />
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(response.submitted_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: response.status === 'complete' ? '#10b981' : '#f59e0b',
                      background: response.status === 'complete' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {response.status}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {response.country || 'Unknown'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {response.answers.length} answers
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              ))}
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
                  Showing {startIndex + 1}-{Math.min(endIndex, totalCount)} of {totalCount}
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

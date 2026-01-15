import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config, getAuthHeaders } from '../config';

export const FormResponses: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

  useEffect(() => {
    loadResponses();
  }, [formId]);

  const loadResponses = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formId}/responses`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load responses');
      }

      const data = await response.json();
      setResponses(data.responses);
      setTotalCount(data.total_count);
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

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          padding: '40px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#dc2626',
            marginBottom: '12px'
          }}>
            Error
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div>
              <button
                onClick={() => navigate(`/forms/${formId}`)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#6b7280',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                ← Back to Form
              </button>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#000000',
                margin: 0
              }}>
                Form Responses
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleExport('csv')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  background: '#9333ea',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              background: '#faf5ff',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '600',
                color: '#9333ea',
                marginBottom: '4px'
              }}>
                {totalCount}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Total Responses
              </div>
            </div>
          </div>
        </div>

        {/* Responses List */}
        {responses.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              📝
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
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
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}>
            {responses.map((response, index) => (
              <div
                key={response.id}
                style={{
                  padding: '20px 24px',
                  borderBottom: index < responses.length - 1 ? '1px solid #e5e7eb' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onClick={() => setSelectedResponse(response)}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#000000',
                      marginBottom: '4px'
                    }}>
                      Response #{response.id}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280'
                    }}>
                      Submitted: {new Date(response.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#9333ea',
                    fontWeight: '500'
                  }}>
                    {response.answers.length} answers →
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedResponse(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#000000',
                margin: 0
              }}>
                Response #{selectedResponse.id}
              </h2>
              <button
                onClick={() => setSelectedResponse(null)}
                style={{
                  padding: '8px',
                  fontSize: '20px',
                  color: '#6b7280',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Submitted: {new Date(selectedResponse.submitted_at).toLocaleString()}
              {selectedResponse.ip_address && ` • IP: ${selectedResponse.ip_address}`}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {selectedResponse.answers.map((answer: any, index: number) => (
                <div key={index}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>
                    {answer.question_text}
                  </div>
                  <div style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#374151'
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

function formatAnswer(value: any): React.ReactNode {
  if (!value) return 'No answer';
  
  if (value.files && Array.isArray(value.files)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {value.files.map((file: any, idx: number) => {
          const label = file?.filename || file?.original_filename || file?.s3_key || `File ${idx + 1}`;
          if (file?.download_url) {
            return (
              <a
                key={idx}
                href={file.download_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#9333ea', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {label}
              </a>
            );
          }
          return (
            <span key={idx}>
              {label}
            </span>
          );
        })}
      </div>
    );
  }

  if (value.text) return value.text;
  if (value.file_url) {
    return (
      <a
        href={value.file_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#9333ea', textDecoration: 'none', fontWeight: 500 }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        {value.file_url}
      </a>
    );
  }
  if (value.number !== undefined) return value.number.toString();
  if (value.choices) return value.choices.join(', ');
  if (value.date) return value.date;
  if (value.rating) return `${value.rating} stars`;
  if (value.matrix_answers) {
    return Object.entries(value.matrix_answers)
      .map(([row, col]) => `${row}: ${col}`)
      .join('; ');
  }
  if (value.ranked_items) return value.ranked_items.join(' > ');
  if (value.wallet_address) return value.wallet_address;
  
  return JSON.stringify(value);
}

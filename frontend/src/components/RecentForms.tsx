import React, { useState, useEffect, useRef } from 'react';
import { config, getAuthHeaders } from '../config';

interface FormMetadata {
  id: number;
  title: string;
  description: string;
  questions_count: number;
  updated_at: string;
  created_at: string;
}

interface RecentFormsProps {
  onLoadForm?: (metadata: FormMetadata) => void;
}

export const RecentForms: React.FC<RecentFormsProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentForms, setRecentForms] = useState<FormMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const displayedForms = showAll ? recentForms : recentForms.slice(0, 5);

  useEffect(() => {
    if (isOpen) {
      loadRecentForms();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadRecentForms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/forms?limit=10&sort=updated_at`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load recent forms');
      }

      const data = await response.json();
      
      // Transform the data to include questions_count
      const forms = (Array.isArray(data) ? data : []).map((form: any) => ({
        ...form,
        questions_count: form.questions?.length || 0
      }));
      
      setRecentForms(forms);
    } catch (error) {
      console.error('Failed to load recent forms:', error);
      setRecentForms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = Date.now();
    const diff = now - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFormClick = (form: FormMetadata, event: React.MouseEvent) => {
    event.preventDefault();
    setIsOpen(false);
    
    // Open in new tab with form ID to load saved state
    const url = `/build?formId=${form.id}`;
    window.open(url, '_blank');
  };

  const clearRecentForms = () => {
    // Since forms are stored in the database per user,
    // we just clear the local display
    setRecentForms([]);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: '#9333ea',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 500,
          padding: '8px 16px',
          borderRadius: '6px',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isOpen ? '#faf5ff' : 'transparent'
        }}
        onMouseOver={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '#faf5ff';
          }
        }}
        onMouseOut={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Recent Forms
        {recentForms.length > 0 && (
          <span style={{
            backgroundColor: '#9333ea',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: 600,
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {recentForms.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          minWidth: '320px',
          maxWidth: '400px',
          maxHeight: '500px',
          overflow: 'hidden',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>
              Recent Forms
            </span>
            {recentForms.length > 0 && (
              <button
                onClick={clearRecentForms}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9333ea',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#faf5ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={{
            overflowY: 'auto',
            maxHeight: '400px'
          }}>
            {isLoading ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>Loading...</p>
              </div>
            ) : recentForms.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p style={{ margin: 0, fontSize: '14px' }}>No recent forms</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Create a form to see it here</p>
              </div>
            ) : (
              <>
              {displayedForms.map((form) => (
                <button
                  key={form.id}
                  onClick={(e) => handleFormClick(form, e)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#1f2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {form.title}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      marginLeft: '8px',
                      flexShrink: 0
                    }}>
                      {formatTimestamp(form.updated_at)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {form.description && (
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {form.description}
                      </span>
                    )}
                    <span style={{ flexShrink: 0 }}>
                      {form.questions_count} question{form.questions_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
              
              {!showAll && recentForms.length > 5 && (
                <button
                  onClick={() => setShowAll(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: '#9333ea',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#faf5ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  Show {recentForms.length - 5} more
                </button>
              )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for saving forms
export const saveFormToRecent = (_metadata: any) => {
  // Forms are automatically saved in the backend when created/updated
  // This function is kept for backward compatibility but doesn't need to do anything
};


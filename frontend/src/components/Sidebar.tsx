import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { config, getAuthHeaders } from '../config';
import { useSidebar } from '../contexts/SidebarContext';

interface Form {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  questions: any[];
  settings?: {
    background_color?: string;
    text_color?: string;
    accent_color?: string;
    bold_text_color?: string;
  };
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredForm, setHoveredForm] = useState<number | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<number | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await fetch(`${config.backendUrl}/api/forms?limit=50&sort=updated_at`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setForms(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!refreshing) {
      loadForms(true);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isFormActive = (formId: number) => {
    return location.pathname.includes(`/forms/${formId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDeleteForm = async (formId: number, formTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${formTitle}"?\n\nThis will permanently delete the form and all its responses.`)) {
      return;
    }

    setDeletingFormId(formId);
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        // Remove from local state
        setForms(forms.filter(f => f.id !== formId));
        
        // If we're currently viewing this form, navigate away
        if (location.pathname.includes(`/forms/${formId}`) || location.state?.formId === formId) {
          navigate('/build');
        }
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.detail || 'Failed to delete form. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
      alert('Failed to delete form. Please try again.');
    } finally {
      setDeletingFormId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      width: '280px',
      height: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      zIndex: 1
    }}>

      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => navigate('/build')}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.2)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Form
        </button>
      </div>

      {/* Navigation */}
      <div style={{
        padding: '16px 12px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <NavItem
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
          label="All Forms"
          active={isActive('/build')}
          onClick={() => navigate('/build')}
        />
      </div>

      {/* Forms List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          padding: '0 8px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Recent Forms
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh forms"
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: refreshing ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              transition: 'all 0.15s',
              opacity: refreshing ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                e.currentTarget.style.color = '#9333ea';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }}
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            Loading...
          </div>
        ) : forms.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '500' }}>No forms yet</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              Create a new form or refresh to see your latest forms
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {forms.map((form) => (
              <div
                key={form.id}
                onMouseEnter={() => setHoveredForm(form.id)}
                onMouseLeave={() => setHoveredForm(null)}
                style={{
                  position: 'relative'
                }}
              >
                <button
                  onClick={() => navigate(`/build`, { state: { formId: form.id } })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: isFormActive(form.id) ? '#f3f4f6' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isFormActive(form.id)) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isFormActive(form.id)) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: isFormActive(form.id) ? '600' : '500',
                    color: '#1f2937',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <span>{children}</span>,
                        strong: ({ children }) => (
                          <strong style={{ 
                            fontWeight: '700', 
                            color: form.settings?.bold_text_color || form.settings?.accent_color || '#9333ea'
                          }}>
                            {children}
                          </strong>
                        )
                      }}
                    >
                      {form.title}
                    </ReactMarkdown>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: '#9ca3af'
                  }}>
                    <span>{form.questions?.length || 0} questions</span>
                    <span>•</span>
                    <span>{formatDate(form.updated_at)}</span>
                  </div>
                </button>

                {/* Quick Actions */}
                {hoveredForm === form.id && (
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: '4px',
                    background: isFormActive(form.id) ? '#f3f4f6' : '#f9fafb',
                    padding: '2px',
                    borderRadius: '4px'
                  }}>
                    <QuickActionButton
                      title="View Responses"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/forms/${form.id}/responses`);
                      }}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                        </svg>
                      }
                    />
                    <QuickActionButton
                      title="Analytics"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/forms/${form.id}/analytics`);
                      }}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      }
                    />
                    <QuickActionButton
                      title="Delete Form"
                      onClick={(e) => handleDeleteForm(form.id, form.title, e)}
                      icon={
                        deletingFormId === form.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        )
                      }
                      danger
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      padding: '10px 12px',
      background: active ? '#f3f4f6' : 'transparent',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'background 0.15s',
      color: active ? '#9333ea' : '#6b7280'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = '#f9fafb';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: active ? '#9333ea' : '#6b7280'
    }}>
      {icon}
    </div>
    <span style={{
      fontSize: '14px',
      fontWeight: active ? '600' : '500',
      color: active ? '#1f2937' : '#6b7280'
    }}>
      {label}
    </span>
  </button>
);

const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}> = ({ icon, onClick, title, danger = false }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '6px',
      background: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: danger ? '#9ca3af' : '#6b7280',
      transition: 'all 0.15s'
    }}
    onMouseEnter={(e) => {
      if (danger) {
        e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
        e.currentTarget.style.color = '#dc2626';
      } else {
        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
        e.currentTarget.style.color = '#9333ea';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = danger ? '#9ca3af' : '#6b7280';
    }}
  >
    {icon}
  </button>
);

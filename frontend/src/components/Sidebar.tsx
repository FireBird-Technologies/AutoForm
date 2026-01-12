import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { config, getAuthHeaders } from '../config';
import { useSidebar } from '../contexts/SidebarContext';

interface Form {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  questions: any[];
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen } = useSidebar();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredForm, setHoveredForm] = useState<number | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
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
      position: 'relative'
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
          fontSize: '11px',
          fontWeight: '600',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px',
          padding: '0 8px'
        }}>
          Recent Forms
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
            color: '#9ca3af',
            fontSize: '13px'
          }}>
            No forms yet
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
                    {form.title}
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
}> = ({ icon, onClick, title }) => (
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
      color: '#6b7280',
      transition: 'all 0.15s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
      e.currentTarget.style.color = '#9333ea';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = '#6b7280';
    }}
  >
    {icon}
  </button>
);

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config, getAuthHeaders } from '../config';

interface FunnelData {
  total_views: number;
  total_starts: number;
  total_completes: number;
  completion_rate: number;
  question_funnel: Array<{
    question_id: number;
    question_text: string;
    answered_count: number;
    drop_off_rate: number;
    avg_time_spent: number;
  }>;
  traffic_sources: Record<string, number>;
  geographic_distribution: Record<string, number>;
}

interface SummaryData {
  total_responses: number;
  complete_responses: number;
  partial_responses: number;
  avg_completion_time_seconds: number;
  recent_activity: {
    last_7_days: number;
    last_24_hours: number;
  };
}

export const FormAnalytics: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [formId, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let startDate: string | undefined;
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : 30;
        const date = new Date();
        date.setDate(date.getDate() - days);
        startDate = date.toISOString();
      }

      // Load funnel and summary in parallel
      const [funnelRes, summaryRes] = await Promise.all([
        fetch(
          `${config.backendUrl}/api/forms/${formId}/analytics/funnel${
            startDate ? `?start_date=${startDate}` : ''
          }`,
          { headers: getAuthHeaders(), credentials: 'include' }
        ),
        fetch(
          `${config.backendUrl}/api/forms/${formId}/analytics/summary`,
          { headers: getAuthHeaders(), credentials: 'include' }
        )
      ]);

      if (!funnelRes.ok || !summaryRes.ok) {
        throw new Error('Failed to load analytics');
      }

      const [funnelData, summaryData] = await Promise.all([
        funnelRes.json(),
        summaryRes.json()
      ]);

      setFunnel(funnelData);
      setSummary(summaryData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb'
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
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#ef4444', fontSize: '16px', marginBottom: '16px' }}>
            {error}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 24px',
              background: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: '#f9fafb',
      padding: '32px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '8px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0
            }}>
              Form Analytics
            </h1>
          </div>

          {/* Date Range Selector */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'white',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {['7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as any)}
                style={{
                  padding: '8px 16px',
                  background: dateRange === range ? '#9333ea' : 'transparent',
                  color: dateRange === range ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.15s'
                }}
              >
                {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'All time'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <StatCard
              title="Total Responses"
              value={summary.total_responses}
              subtitle={`${summary.complete_responses} complete`}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              }
              color="#9333ea"
            />
            <StatCard
              title="Completion Rate"
              value={`${funnel?.completion_rate || 0}%`}
              subtitle={`${funnel?.total_completes || 0} of ${funnel?.total_starts || 0} started`}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              }
              color="#10b981"
            />
            <StatCard
              title="Avg. Completion Time"
              value={formatTime(summary.avg_completion_time_seconds)}
              subtitle={`Time to complete`}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
              color="#f59e0b"
            />
            <StatCard
              title="Recent Activity"
              value={summary.recent_activity.last_24_hours}
              subtitle={`${summary.recent_activity.last_7_days} in last 7 days`}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
              color="#3b82f6"
            />
          </div>
        )}

        {/* Funnel Visualization */}
        {funnel && funnel.question_funnel.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '24px'
            }}>
              Question Funnel
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {funnel.question_funnel.map((question, index) => {
                const maxCount = funnel.question_funnel[0]?.answered_count || 1;
                const widthPercent = (question.answered_count / maxCount) * 100;
                
                return (
                  <div key={question.question_id}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '13px'
                    }}>
                      <span style={{ color: '#1f2937', fontWeight: '500' }}>
                        Q{index + 1}: {question.question_text}
                      </span>
                      <span style={{ color: '#6b7280' }}>
                        {question.answered_count} responses • {formatTime(question.avg_time_spent)}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '32px',
                      background: '#f3f4f6',
                      borderRadius: '6px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${widthPercent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #9333ea 0%, #7e22ce 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '12px',
                        transition: 'width 0.5s ease'
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {question.drop_off_rate > 0 && `${question.drop_off_rate}% drop-off`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Traffic Sources & Geography */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {/* Traffic Sources */}
          {funnel && Object.keys(funnel.traffic_sources).length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px'
              }}>
                Traffic Sources
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(funnel.traffic_sources).map(([source, count]) => (
                  <div key={source} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                      {source || 'Direct'}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#9333ea',
                      padding: '4px 12px',
                      background: 'rgba(147, 51, 234, 0.1)',
                      borderRadius: '12px'
                    }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geographic Distribution */}
          {funnel && Object.keys(funnel.geographic_distribution).length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px'
              }}>
                Geographic Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(funnel.geographic_distribution)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 10)
                  .map(([location, count]) => (
                    <div key={location} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                        {location}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#3b82f6',
                        padding: '4px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '12px'
                      }}>
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }}>
      <span style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {title}
      </span>
      <div style={{
        padding: '8px',
        background: `${color}15`,
        borderRadius: '8px',
        color: color
      }}>
        {icon}
      </div>
    </div>
    <div style={{
      fontSize: '32px',
      fontWeight: '700',
      color: '#1f2937'
    }}>
      {value}
    </div>
    <div style={{
      fontSize: '13px',
      color: '#9ca3af'
    }}>
      {subtitle}
    </div>
  </div>
);

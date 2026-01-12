import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config, getAuthHeaders } from '../config';
import { BarChart } from '../components/analytics/BarChart';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { FilterPanel, AnalyticsFilters } from '../components/analytics/FilterPanel';

interface TimeSeriesData {
  time_series: Array<{ date: string; views: number; submissions: number }>;
  total_views: number;
  total_submissions: number;
}

interface FunnelData {
  total_views: number;
  total_starts: number;
  total_completes: number;
  completion_rate: number;
  question_funnel: Array<{
    question_id: number;
    question_text: string;
    question_order: number;
    viewed: number;
    answered: number;
    skipped: number;
    drop_off_rate: number;
    avg_time_spent: number;
  }>;
  traffic_sources: Record<string, { count: number; completion_rate: number }>;
  geographic_distribution: Record<string, { views: number; completes: number }>;
}

interface SummaryData {
  total_responses: number;
  complete_responses: number;
  partial_responses: number;
  avg_completion_time_seconds?: number;
  recent_activity?: {
    last_7_days: number;
    last_24_hours: number;
  };
}

interface FormData {
  id: number;
  title: string;
  questions: Array<{ id: number; question_text: string; question_order: number }>;
}

export const FormAnalyticsNew: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d'
  });

  useEffect(() => {
    loadForm();
  }, [formId]);

  useEffect(() => {
    if (formData) {
      loadAnalytics();
    }
  }, [formId, filters, formData]);

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

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const dateParams = getDateParams();
      const filterParams = getFilterParams();
      const queryString = new URLSearchParams({ ...dateParams, ...filterParams }).toString();

      // Load all analytics data in parallel
      const [timeSeriesRes, funnelRes, summaryRes] = await Promise.all([
        fetch(
          `${config.backendUrl}/api/forms/${formId}/analytics/timeseries?${queryString}`,
          { headers: getAuthHeaders(), credentials: 'include' }
        ),
        fetch(
          `${config.backendUrl}/api/forms/${formId}/analytics/funnel?${queryString}`,
          { headers: getAuthHeaders(), credentials: 'include' }
        ),
        fetch(
          `${config.backendUrl}/api/forms/${formId}/analytics/summary`,
          { headers: getAuthHeaders(), credentials: 'include' }
        )
      ]);

      if (!timeSeriesRes.ok || !funnelRes.ok || !summaryRes.ok) {
        throw new Error('Failed to load analytics');
      }

      const [timeSeriesData, funnelData, summaryData] = await Promise.all([
        timeSeriesRes.json(),
        funnelRes.json(),
        summaryRes.json()
      ]);

      setTimeSeries(timeSeriesData);
      setFunnel(funnelData);
      setSummary(summaryData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getDateParams = (): Record<string, string> => {
    if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
      return {
        start_date: new Date(filters.customStartDate).toISOString(),
        end_date: new Date(filters.customEndDate).toISOString()
      };
    }

    const end = new Date();
    let start = new Date();
    
    switch (filters.dateRange) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case 'all':
        return {};
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString()
    };
  };

  const getFilterParams = () => {
    const params: Record<string, string> = {};
    
    if (filters.questionIds && filters.questionIds.length > 0) {
      params.question_ids = filters.questionIds.join(',');
    }
    if (filters.countries && filters.countries.length > 0) {
      params.countries = filters.countries.join(',');
    }
    if (filters.utmSource) {
      params.utm_source = filters.utmSource;
    }
    
    return params;
  };

  if (loading && !timeSeries) {
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

  const availableCountries = funnel ? Object.keys(funnel.geographic_distribution) : [];

  // Calculate conversion rate
  const conversionRate = funnel && funnel.total_views > 0 
    ? (funnel.total_completes / funnel.total_views) * 100 
    : 0;

  return (
    <div style={{
      padding: '40px',
      background: '#fafafa',
      minHeight: '100vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '6px',
          letterSpacing: '-0.02em'
        }}>
          Analytics
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#6b7280',
          fontWeight: '400'
        }}>
          Track form submissions and user behavior
        </p>
      </div>

      {/* Filters */}
      {formData && (
        <div style={{ marginBottom: '24px' }}>
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            questions={formData.questions || []}
            availableCountries={availableCountries}
          />
        </div>
      )}

      {/* Chart + Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Bar Chart */}
        {timeSeries && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '4px',
              letterSpacing: '-0.01em'
            }}>
              Submissions vs Views
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              Track form engagement over time
            </p>
            <div style={{ height: '360px' }}>
              <BarChart data={timeSeries.time_series} height={360} />
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e9d5ff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
              Total Submissions
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#9333ea', marginBottom: '4px' }}>
              {(summary?.total_responses || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
              +12% from last period
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e9d5ff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
              Total Views
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#9333ea', marginBottom: '4px' }}>
              {(funnel?.total_views || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
              +8% from last period
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e9d5ff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
              Conversion Rate
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#9333ea', marginBottom: '4px' }}>
              {conversionRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
              +2.1% from last period
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Chart */}
      {funnel && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#111827', 
            marginBottom: '4px',
            letterSpacing: '-0.01em'
          }}>
            Conversion Funnel
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '20px'
          }}>
            Track user progression through form completion
          </p>
          <FunnelChart
            height={400}
            stages={[
              {
                label: 'Page Views',
                value: funnel.total_views,
                percentage: 100,
                dropOff: funnel.total_views > 0 ? ((funnel.total_views - funnel.total_starts) / funnel.total_views) * 100 : 0
              },
              {
                label: 'Form Opened (Q1)',
                value: funnel.total_starts,
                percentage: funnel.total_views > 0 ? (funnel.total_starts / funnel.total_views) * 100 : 0,
                dropOff: 15
              },
              ...funnel.question_funnel.slice(0, 2).map((q, idx) => ({
                label: `Q${idx + 1} Completed`,
                value: q.answered,
                percentage: funnel.total_views > 0 ? (q.answered / funnel.total_views) * 100 : 0,
                dropOff: q.drop_off_rate
              })),
              {
                label: 'Form Completed',
                value: funnel.total_completes,
                percentage: funnel.total_views > 0 ? (funnel.total_completes / funnel.total_views) * 100 : 0
              }
            ]}
            totalViews={funnel.total_views}
          />
        </div>
      )}
    </div>
  );
};

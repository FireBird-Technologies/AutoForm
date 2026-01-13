import React, { useState } from 'react';
import { QuestionRenderer } from '../QuestionRenderer';
import { BarChart } from '../analytics/BarChart';
import { FunnelChart } from '../analytics/FunnelChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Tab = 'form' | 'analytics' | 'submissions';

export const InteractiveDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [formData, setFormData] = useState<Record<number, any>>({});

  // Sample form questions
  const demoQuestions = [
    {
      id: 1,
      question_type: 'email',
      question_text: 'What is your **email address**?',
      description: '',
      required: true,
      settings: { placeholder: 'you@example.com' }
    },
    {
      id: 2,
      question_type: 'rating',
      question_text: 'How **satisfied** are you with our service?',
      description: '',
      required: true,
      settings: { max_rating: 5, icon: 'star' }
    },
    {
      id: 3,
      question_type: 'long_answer',
      question_text: 'Any **additional feedback**?',
      description: 'Share your thoughts with us',
      required: false,
      settings: { placeholder: 'Type your feedback here...', max_length: 500 }
    }
  ];

  // Sample analytics data
  const timeSeriesData = [
    { date: 'Jan 8', views: 45, submissions: 12 },
    { date: 'Jan 9', views: 52, submissions: 18 },
    { date: 'Jan 10', views: 68, submissions: 24 },
    { date: 'Jan 11', views: 84, submissions: 31 },
    { date: 'Jan 12', views: 92, submissions: 38 },
    { date: 'Jan 13', views: 105, submissions: 45 }
  ];

  const funnelData = [
    { label: 'Form Viewed', value: 105, percentage: 100 },
    { label: 'Started', value: 92, percentage: 88 },
    { label: 'Q1: Email', value: 78, percentage: 74 },
    { label: 'Q2: Rating', value: 58, percentage: 55 },
    { label: 'Submitted', value: 45, percentage: 43 }
  ];

  // Sample submissions
  const sampleSubmissions = [
    {
      id: 1,
      submitted_at: '2026-01-13 14:32',
      responses: {
        1: 'john@example.com',
        2: 5,
        3: 'Love the AI features!'
      }
    },
    {
      id: 2,
      submitted_at: '2026-01-13 13:18',
      responses: {
        1: 'sarah@example.com',
        2: 4,
        3: 'Great product overall'
      }
    },
    {
      id: 3,
      submitted_at: '2026-01-13 11:45',
      responses: {
        1: 'mike@example.com',
        2: 5,
        3: 'This saves me so much time!'
      }
    }
  ];

  const handleAnswerChange = (questionId: number, value: any) => {
    setFormData({ ...formData, [questionId]: value });
  };

  const tabs = [
    { id: 'form' as Tab, label: 'Form Preview' },
    { id: 'analytics' as Tab, label: 'Analytics' },
    { id: 'submissions' as Tab, label: 'Submissions' }
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(147, 51, 234, 0.12)',
      border: '1px solid #e9d5ff'
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #f3f4f6',
        backgroundColor: '#fafafa'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: activeTab === tab.id ? '#ffffff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #9333ea' : '3px solid transparent',
              color: activeTab === tab.id ? '#9333ea' : '#6b7280',
              fontSize: '15px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '32px', minHeight: '500px', maxHeight: '600px', overflowY: 'auto' }}>
        {activeTab === 'form' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                Customer Feedback Survey
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Try filling out this interactive demo form - all components are fully functional!
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {demoQuestions.map((question) => (
                <div key={question.id}>
                  {/* Question Label with Markdown support */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                        strong: ({ children }) => <strong style={{ color: '#9333ea' }}>{children}</strong>
                      }}
                    >
                      {question.question_text}
                    </ReactMarkdown>
                    {question.required && <span style={{ color: '#9333ea', marginLeft: '4px' }}>*</span>}
                  </div>
                  
                  {/* Description with Markdown support */}
                  {question.description && (
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                          strong: ({ children }) => <strong style={{ color: '#9333ea' }}>{children}</strong>
                        }}
                      >
                        {question.description}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  {/* Question Input - using QuestionRenderer without labels */}
                  <QuestionRenderer
                    question={question}
                    value={formData[question.id]}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                    hideLabel={true}
                    accentColor="#9333ea"
                    boldTextColor="#9333ea"
                  />
                </div>
              ))}
            </div>
            <button
              style={{
                marginTop: '32px',
                padding: '14px 28px',
                background: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#9333ea';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Submit (Demo)
            </button>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                Analytics Dashboard
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Track views, submissions, and conversion rates in real-time
              </p>
            </div>

            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                padding: '16px',
                background: '#faf5ff',
                borderRadius: '12px',
                border: '1px solid #e9d5ff'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Views</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#9333ea' }}>105</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#faf5ff',
                borderRadius: '12px',
                border: '1px solid #e9d5ff'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Submissions</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#9333ea' }}>45</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#faf5ff',
                borderRadius: '12px',
                border: '1px solid #e9d5ff'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Completion Rate</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#9333ea' }}>43%</div>
              </div>
            </div>

            {/* Charts */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                Views & Submissions Over Time
              </h4>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <BarChart data={timeSeriesData} height={300} />
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                Conversion Funnel
              </h4>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <FunnelChart stages={funnelData} height={240} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                Form Submissions
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                View and manage all form responses
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Submitted
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Email
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Rating
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>
                      Feedback
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#faf5ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>
                        {submission.submitted_at}
                      </td>
                      <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>
                        {submission.responses[1]}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          background: '#faf5ff',
                          borderRadius: '6px',
                          color: '#9333ea',
                          fontWeight: '600'
                        }}>
                          {'⭐'.repeat(submission.responses[2] as number)}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px',
                        color: '#6b7280',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {submission.responses[3] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#faf5ff',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              📊 Showing 3 of 45 submissions
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

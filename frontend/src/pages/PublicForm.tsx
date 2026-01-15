import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QuestionRenderer } from '../components/QuestionRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { config } from '../config';

export const PublicForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Extract colors from form settings
  const backgroundColor = formData?.settings?.background_color || '#ffffff';
  const textColor = formData?.settings?.text_color || '#1f2937';
  const accentColor = formData?.settings?.accent_color || '#9333ea';
  const boldTextColor = formData?.settings?.bold_text_color || accentColor;

  useEffect(() => {
    loadForm();
  }, [token]);

  const loadForm = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/public/forms/${token}`);
      
      if (!response.ok) {
        throw new Error('Form not found or no longer accepting responses');
      }

      const data = await response.json();
      setFormData(data.form);
      setLoading(false);
      
      // Track form view
      trackEvent('form_viewed');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, questionId?: number, timeSpent?: number) => {
    try {
      await fetch(`${config.backendUrl}/api/public/forms/${token}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          session_id: sessionId,
          question_id: questionId,
          time_spent: timeSpent
        })
      });
    } catch (err) {
      // Silently fail - don't break form for analytics
      console.error('Analytics tracking failed:', err);
    }
  };

  const evaluateConditionalLogic = () => {
    const visibleQuestions = new Set<number>();

    formData.questions?.forEach((q: any) => {
      visibleQuestions.add(q.id);
    });

    formData.conditional_rules?.forEach((rule: any) => {
      const triggerAnswer = answers[rule.trigger_question_id];
      let conditionMet = false;

      if (triggerAnswer) {
        switch (rule.condition_type) {
          case 'equals':
            conditionMet = triggerAnswer.text === rule.condition_value ||
                          triggerAnswer.number?.toString() === rule.condition_value;
            break;
          case 'not_equals':
            conditionMet = triggerAnswer.text !== rule.condition_value;
            break;
          case 'contains':
            conditionMet = triggerAnswer.text?.includes(rule.condition_value);
            break;
          case 'is_not_empty':
            conditionMet = !!triggerAnswer.text || !!triggerAnswer.number || 
                          (triggerAnswer.choices && triggerAnswer.choices.length > 0);
            break;
          case 'is_empty':
            conditionMet = !triggerAnswer.text && !triggerAnswer.number && 
                          (!triggerAnswer.choices || triggerAnswer.choices.length === 0);
            break;
        }
      }

      if (conditionMet) {
        if (rule.action === 'show') {
          visibleQuestions.add(rule.target_question_id);
        } else if (rule.action === 'hide') {
          visibleQuestions.delete(rule.target_question_id);
        }
      } else {
        if (rule.action === 'show') {
          visibleQuestions.delete(rule.target_question_id);
        }
      }
    });

    return visibleQuestions;
  };

  const visibleQuestionIds = formData ? evaluateConditionalLogic() : new Set();

  const handleAnswerChange = (questionId: number, value: any) => {
    const isFirstAnswer = Object.keys(answers).length === 0;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Track first answer as form started
    if (isFirstAnswer) {
      trackEvent('form_started');
    }
    
    // Track question answered
    trackEvent('question_answered', questionId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required questions
    const visibleQuestions = formData.questions.filter((q: any) => visibleQuestionIds.has(q.id));
      const missingRequired = visibleQuestions.filter((q: any) => {
        if (!q.required) return false;
        const answer = answers[q.id];
        if (!answer) return true;
        
        // Check if answer is empty based on type
        if (answer.text !== undefined) return !answer.text;
        if (answer.number !== undefined) return answer.number === null;
        if (answer.choices !== undefined) return answer.choices.length === 0;
        if (answer.rating !== undefined) return !answer.rating;
        if (answer.files !== undefined) return !answer.files || answer.files.length === 0;
        
        return false;
      });

    if (missingRequired.length > 0) {
      setError('Please answer all required questions');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const submissionData = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          question_id: parseInt(questionId),
          answer_value: value
        }))
      };

      const response = await fetch(`${config.backendUrl}/api/public/forms/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      // Track form completion
      trackEvent('form_submitted_complete');

      const data = await response.json();
      setThankYouMessage(data.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: backgroundColor
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: backgroundColor
      }}>
        <div style={{
          maxWidth: '500px',
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
            Form Not Found
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: backgroundColor,
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          padding: '60px 40px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            background: boldTextColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: '#ffffff'
          }}>
            ✓
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: textColor,
            marginBottom: '12px'
          }}>
            Thank You!
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            {thankYouMessage || 'Your response has been submitted successfully.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: backgroundColor,
      padding: '40px 24px 40px 64px',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Floating AutoForm Branding Widget */}
      <a
        href="https://autoform.ink"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(12px)',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 1000,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          textDecoration: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
        }}
      >
        <span style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#6b7280',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.005em'
        }}>
          made with <span style={{ color: '#9333ea', fontWeight: '600' }}>AutoForm</span>
        </span>
      </a>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '100px'
      }}>
        {/* Header - matches edit view */}
        <div style={{
          marginBottom: '48px',
          paddingTop: '20px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '600',
            color: textColor,
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                strong: ({ children }) => <strong style={{ color: boldTextColor }}>{children}</strong>
              }}
            >
              {formData.title}
            </ReactMarkdown>
          </h1>
          {formData.description && (
            <div style={{
              fontSize: '17px',
              color: textColor,
              opacity: 0.7,
              lineHeight: '1.6'
            }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                  strong: ({ children }) => <strong style={{ color: boldTextColor }}>{children}</strong>
                }}
              >
                {formData.description}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {formData.questions
              ?.filter((q: any) => visibleQuestionIds.has(q.id))
              .sort((a: any, b: any) => a.question_order - b.question_order)
              .map((question: any, index: number) => (
                <div
                  key={question.id}
                  style={{
                    padding: '48px 0',
                    borderBottom: index < formData.questions.length - 1 ? '1px solid #e5e7eb' : 'none',
                    position: 'relative'
                  }}
                >
                  {/* Question Text - matches edit view with markdown */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: textColor,
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                          strong: ({ children }) => <strong style={{ color: boldTextColor }}>{children}</strong>
                        }}
                      >
                        {question.question_text}
                      </ReactMarkdown>
                      {question.required && <span style={{ color: boldTextColor, marginLeft: '4px' }}>*</span>}
                    </div>
                    
                    {/* Description - matches edit view with markdown */}
                    {question.description && (
                      <div style={{
                        fontSize: '14px',
                        color: textColor,
                        opacity: 0.7,
                        lineHeight: '1.5'
                      }}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <span style={{ margin: 0 }}>{children}</span>,
                            strong: ({ children }) => <strong style={{ color: boldTextColor }}>{children}</strong>
                          }}
                        >
                          {question.description}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Question Input - using QuestionRenderer without labels */}
                  <div style={{ marginTop: '8px' }}>
                    <QuestionRenderer
                      question={question}
                      value={answers[question.id] || {}}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                      disabled={false}
                      hideLabel={true}
                      accentColor={accentColor}
                      boldTextColor={boldTextColor}
                      uploadContext={{ token }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {error && (
            <div style={{
              marginTop: '24px',
              padding: '12px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: '48px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              background: submitting ? '#d1d5db' : boldTextColor,
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {submitting ? 'Submitting...' : (formData.settings?.submit_button_text || 'Submit')}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          color: textColor,
          opacity: 0.5,
          marginTop: '48px'
        }}>
          Made using{' '}
          <a
            href="https://autoform.ink"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: accentColor,
              textDecoration: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            AutoForm
          </a>
        </div>
      </div>
    </div>
  );
};

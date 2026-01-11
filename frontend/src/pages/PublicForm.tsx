import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QuestionRenderer } from '../components/QuestionRenderer';
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
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
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
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
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
        background: '#f9fafb'
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
        background: '#f9fafb'
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
        background: '#f9fafb',
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
            background: '#9333ea',
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
            color: '#000000',
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
      background: '#f9fafb',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '12px'
          }}>
            {formData.title}
          </h1>
          {formData.description && (
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              {formData.description}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {formData.questions
                ?.filter((q: any) => visibleQuestionIds.has(q.id))
                .sort((a: any, b: any) => a.question_order - b.question_order)
                .map((question: any) => (
                  <div key={question.id}>
                    <QuestionRenderer
                      question={question}
                      value={answers[question.id] || {}}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                      disabled={false}
                    />
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
                marginTop: '32px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#ffffff',
                background: submitting ? '#d1d5db' : '#9333ea',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {submitting ? 'Submitting...' : (formData.settings?.submit_button_text || 'Submit')}
            </button>
          </form>
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#9ca3af'
        }}>
          Powered by AutoForm
        </div>
      </div>
    </div>
  );
};


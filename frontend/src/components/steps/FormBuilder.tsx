import React, { useState } from 'react';
import { QuestionRenderer } from '../QuestionRenderer';
import { config, getAuthHeaders } from '../../config';

interface FormBuilderProps {
  formData: any;
  onBack?: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ formData: initialFormData, onBack }) => {
  const [formData, _setFormData] = useState(initialFormData);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [showConditionalLogic, setShowConditionalLogic] = useState(false);

  // Evaluate conditional logic to determine which questions to show
  const evaluateConditionalLogic = () => {
    const visibleQuestions = new Set<number>();
    const hiddenQuestions = new Set<number>();

    // Initially, all questions are visible
    formData.questions?.forEach((q: any) => {
      visibleQuestions.add(q.id);
    });

    // Apply conditional rules
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

      // Apply action
      if (conditionMet) {
        if (rule.action === 'show') {
          visibleQuestions.add(rule.target_question_id);
          hiddenQuestions.delete(rule.target_question_id);
        } else if (rule.action === 'hide') {
          visibleQuestions.delete(rule.target_question_id);
          hiddenQuestions.add(rule.target_question_id);
        }
      } else {
        // Condition not met - reverse the action
        if (rule.action === 'show') {
          visibleQuestions.delete(rule.target_question_id);
          hiddenQuestions.add(rule.target_question_id);
        }
      }
    });

    return visibleQuestions;
  };

  const visibleQuestionIds = evaluateConditionalLogic();

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/share`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          allow_multiple_submissions: true,
          collect_email: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const link = `${window.location.origin}/public/forms/${data.share_token}`;
        setShareLink(link);
        setShowSharePopup(true);
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                color: '#6b7280',
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
          )}
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
              margin: 0
            }}>
              {formData.title}
            </h2>
            {formData.description && (
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '4px 0 0 0'
              }}>
                {formData.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#9333ea',
              background: '#faf5ff',
              border: '1px solid #9333ea',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {showPreview ? 'Edit Mode' : 'Preview'}
          </button>
          <button
            onClick={() => setShowConditionalLogic(true)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#6b7280',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Conditional Logic
          </button>
          <button
            onClick={handleShare}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              background: '#9333ea',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Share Form
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            {formData.questions && formData.questions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {formData.questions
                  .filter((q: any) => visibleQuestionIds.has(q.id))
                  .sort((a: any, b: any) => a.question_order - b.question_order)
                  .map((question: any) => (
                    <div
                      key={question.id}
                      style={{
                        padding: '20px',
                        background: editingQuestion === question.id ? '#faf5ff' : '#f9fafb',
                        borderRadius: '8px',
                        border: editingQuestion === question.id ? '2px solid #9333ea' : '1px solid #e5e7eb',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => !showPreview && setEditingQuestion(question.id)}
                    >
                      <QuestionRenderer
                        question={question}
                        value={answers[question.id] || {}}
                        onChange={(value) => handleAnswerChange(question.id, value)}
                        disabled={!showPreview}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <p>No questions yet. Add questions to your form.</p>
              </div>
            )}

            {showPreview && (
              <button
                style={{
                  width: '100%',
                  marginTop: '32px',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  background: '#9333ea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {formData.settings?.submit_button_text || 'Submit'}
              </button>
            )}
          </div>

          {/* Form Stats */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#ffffff',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-around',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#9333ea' }}>
                {formData.questions?.length || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Questions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#9333ea' }}>
                {formData.conditional_rules?.length || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Rules</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#9333ea' }}>
                {formData.questions?.filter((q: any) => q.required).length || 0}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Required</div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Popup */}
      {showSharePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '16px'
            }}>
              Share Your Form
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              Anyone with this link can fill out your form:
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <input
                type="text"
                value={shareLink}
                readOnly
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f9fafb'
                }}
              />
              <button
                onClick={copyShareLink}
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
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowSharePopup(false)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Conditional Logic Popup - Placeholder */}
      {showConditionalLogic && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '16px'
            }}>
              Conditional Logic
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              {formData.conditional_rules?.length || 0} rule(s) configured
            </p>
            {formData.conditional_rules?.map((rule: any, index: number) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                Rule {index + 1}: {rule.action} question when condition is {rule.condition_type}
              </div>
            ))}
            <button
              onClick={() => setShowConditionalLogic(false)}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


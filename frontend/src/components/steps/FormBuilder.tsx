import React, { useState, useEffect, useRef } from 'react';
import { QuestionEditor } from '../QuestionEditor';
import { LoadingAnimation } from '../LoadingAnimation';
import { ConditionModal } from '../ConditionModal';
import { QuestionColorPicker } from '../ColorPicker';
import { SideAddButton } from '../SideAddButton';
import { InlineEditableText, EditableOptions } from '../InlineEditableText';
import { ComponentPicker } from '../ComponentPicker';
import { config, getAuthHeaders } from '../../config';

interface FormBuilderProps {
  formData: any;
  onBack?: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ formData: initialFormData, onBack }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(initialFormData.isGenerating || false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [conditionForQuestion, setConditionForQuestion] = useState<any>(null);
  const [showQuestionColorPicker, setShowQuestionColorPicker] = useState(false);
  const [colorPickerForQuestion, setColorPickerForQuestion] = useState<number | null>(null);
  const [questionColors, setQuestionColors] = useState<Record<number, any>>({});
  const [globalColors, setGlobalColors] = useState({
    background: initialFormData.settings?.background_color || '#ffffff',
    text: initialFormData.settings?.text_color || '#1f2937',
    accent: initialFormData.settings?.accent_color || '#9333ea'
  });
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [chatPanelWidth, setChatPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Save global colors to form settings when they change
  useEffect(() => {
    if (formData.id) {
      const currentBg = formData.settings?.background_color || '#ffffff';
      const currentText = formData.settings?.text_color || '#1f2937';
      const currentAccent = formData.settings?.accent_color || '#9333ea';
      
      // Only update if colors actually changed
      if (
        currentBg !== globalColors.background ||
        currentText !== globalColors.text ||
        currentAccent !== globalColors.accent
      ) {
        const updatedSettings = {
          ...formData.settings,
          background_color: globalColors.background,
          text_color: globalColors.text,
          accent_color: globalColors.accent
        };
        
        // Update local state
        setFormData({ ...formData, settings: updatedSettings });
        
        // Save to backend
        saveFormSettings(updatedSettings);
      }
    }
  }, [globalColors.background, globalColors.text, globalColors.accent]);

  // Save form settings to backend
  const saveFormSettings = async (settings: any) => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ settings })
      });
      
      if (!response.ok) {
        console.error('Failed to save form settings');
      }
    } catch (err) {
      console.error('Error saving form settings:', err);
    }
  };

  // Handle chat editing
  const handleChatEdit = async () => {
    if (!chatInput.trim() || isGenerating) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/chat`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ message: userMessage })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process chat message');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage = data.changes_made || data.response?.message || 'Changes applied';
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      
      // Refresh form data to get updated questions
      const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (formResponse.ok) {
        const updatedForm = await formResponse.json();
        setFormData(updatedForm);
      }
    } catch (err: any) {
      console.error('Chat edit error:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that request. Please try again.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle form generation on mount if needed
  useEffect(() => {
    if (initialFormData.isGenerating && initialFormData.user_query) {
      generateForm(initialFormData.user_query);
    }
  }, []);

  // Handle chat panel resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 300 && newWidth <= 600) {
        setChatPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const generateForm = async (userQuery: string) => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/generate`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          user_query: userQuery
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate form');
      }

      const data = await response.json();
      setFormData(data.form);
      setChatMessages([
        { role: 'user', content: userQuery },
        { role: 'assistant', content: `I've created your form with ${data.form.questions.length} questions. You can edit questions by clicking on them or chat with me to make changes.` }
      ]);
    } catch (err: any) {
      console.error('Form generation error:', err);
      setChatMessages([
        { role: 'user', content: userQuery },
        { role: 'assistant', content: `Sorry, I couldn't generate the form: ${err.message}` }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuestion = async (updates: any) => {
    if (!selectedQuestion) return;

    try {
      // Save to backend
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formData.id}/questions/${selectedQuestion.id}`,
        {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save question');
      }

      // Update local state
      const updatedQuestions = formData.questions.map((q: any) =>
        q.id === selectedQuestion.id ? { ...q, ...updates } : q
      );

      setFormData({ ...formData, questions: updatedQuestions });
      setSelectedQuestion({ ...selectedQuestion, ...updates });
    } catch (err) {
      console.error('Failed to save question:', err);
      alert('Failed to save question. Please try again.');
    }
  };

  const handleRegenerateQuestion = async (question: any, prompt: string) => {
    try {
      const response = await fetch(
        `${config.backendUrl}/api/forms/${formData.id}/questions/${question.id}/regenerate`,
        {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ 
            context: prompt || 'Regenerate this question',
            prompt: prompt
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to regenerate question');
      }

      const data = await response.json();
      
      // Update the question in the form
      if (data.question) {
        const updatedQuestions = formData.questions.map((q: any) =>
          q.id === question.id ? { ...q, ...data.question } : q
        );
        setFormData({ ...formData, questions: updatedQuestions });
      }
    } catch (err: any) {
      console.error('Question regeneration error:', err);
      alert(err.message || 'Failed to regenerate question. Please try again.');
    }
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = formData.questions.filter((q: any) => q.id !== questionId);
      setFormData({ ...formData, questions: updatedQuestions });
    }
  };

  // Handle inline editing of question text, description, or options
  const handleInlineQuestionUpdate = (questionId: number, field: string, value: any) => {
    const updatedQuestions = formData.questions.map((q: any) => {
      if (q.id === questionId) {
        if (field === 'settings.choices') {
          return { ...q, settings: { ...q.settings, choices: value } };
        }
        return { ...q, [field]: value };
      }
      return q;
    });
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleSaveCondition = (condition: any) => {
    // Add or update conditional rule
    const existingRules = formData.conditional_rules || [];
    const updatedRules = [...existingRules, condition];
    setFormData({ ...formData, conditional_rules: updatedRules });
  };

  const handleQuestionColorChange = (questionId: number, colors: any) => {
    setQuestionColors((prev) => ({
      ...prev,
      [questionId]: colors
    }));
  };

  const handleAddQuestion = async (questionType: string, atIndex?: number | null) => {
    if (!formData.id) {
      alert('Form must be saved before adding questions');
      return;
    }

    try {
      // Determine the question order based on insertion index
      let questionOrder: number;
      if (atIndex !== undefined && atIndex !== null && formData.questions?.length > 0) {
        // Insert at specific position - use the order of the question at that index
        const sortedQuestions = [...formData.questions].sort((a: any, b: any) => a.question_order - b.question_order);
        questionOrder = sortedQuestions[atIndex]?.question_order ?? atIndex;
        
        // Shift all questions at or after this position
        // This will be handled by refetching the form
      } else {
        // Add at the end
        const maxOrder = formData.questions?.length > 0
          ? Math.max(...formData.questions.map((q: any) => q.question_order))
          : -1;
        questionOrder = maxOrder + 1;
      }

      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/questions`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          question_order: questionOrder,
          question_type: questionType,
          question_text: 'New Question',
          description: '',
          required: false,
          settings: questionType === 'multiple_choice' || questionType === 'checkboxes' || questionType === 'dropdown' || questionType === 'multi_select'
            ? { choices: ['Option 1', 'Option 2', 'Option 3'] }
            : questionType === 'ranking'
            ? { ranking_items: ['Item 1', 'Item 2', 'Item 3'] }
            : questionType === 'matrix'
            ? { rows: ['Row 1', 'Row 2'], columns: ['Column 1', 'Column 2', 'Column 3'] }
            : questionType === 'linear_scale'
            ? { min_value: 1, max_value: 5, scale_min_label: 'Low', scale_max_label: 'High' }
            : questionType === 'rating'
            ? { max_value: 5 }
            : {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      const newQuestion = await response.json();
      
      // Refresh form data
      const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (formResponse.ok) {
        const updatedForm = await formResponse.json();
        setFormData(updatedForm);
      }
      
      // Reset insert index
      setInsertAtIndex(null);
    } catch (err) {
      console.error('Failed to add question:', err);
      alert('Failed to add question. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/share`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
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
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Share failed:', errorData);
        alert('Failed to create share link. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert('Failed to create share link. Please try again.');
    }
  };

  const handlePreview = async () => {
    try {
      // First create/get share link
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/share`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json'
        }),
        credentials: 'include',
        body: JSON.stringify({
          form_id: formData.id,
          allow_multiple_submissions: true,
          collect_email: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const previewUrl = `${window.location.origin}/public/forms/${data.share_token}`;
        window.open(previewUrl, '_blank');
      } else {
        alert('Failed to generate preview. Please try again.');
      }
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to generate preview. Please try again.');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  // Evaluate conditional logic to determine which questions to show
  const evaluateConditionalLogic = () => {
    const visibleQuestions = new Set<number>();

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
        } else if (rule.action === 'hide') {
          visibleQuestions.delete(rule.target_question_id);
        }
      } else {
        // Condition not met - reverse the action
        if (rule.action === 'show') {
          visibleQuestions.delete(rule.target_question_id);
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

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: globalColors.background
    }}>
      {/* Top Bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
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
          <input
            type="text"
            value={formData.title || 'Untitled Form'}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Form title"
            style={{
              fontSize: '18px',
              fontWeight: '500',
              color: globalColors.text,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              maxWidth: '500px',
              padding: '4px 0'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Add Component Button */}
          <button
            onClick={() => {
              setInsertAtIndex(null);
              setShowComponentPicker(true);
            }}
            style={{
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9333ea';
              e.currentTarget.style.color = '#9333ea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#374151';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>

          {/* Preview Button */}
          <button
            onClick={handlePreview}
            style={{
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9333ea';
              e.currentTarget.style.color = '#9333ea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#374151';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview
          </button>

          {/* Background Color */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBgColorPicker(!showBgColorPicker)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: globalColors.background,
                border: '2px solid #e5e7eb',
                cursor: 'pointer',
                position: 'relative'
              }}
              title="Background Color"
            >
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#6b7280" stroke="none">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </div>
            </button>
            {showBgColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #e5e7eb',
                  padding: '12px',
                  zIndex: 100
                }}
                onMouseLeave={() => setShowBgColorPicker(false)}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                  Background
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#faf5ff', '#fef2f2', '#f0fdf4', '#eff6ff', '#fefce8'].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setGlobalColors({ ...globalColors, background: color });
                        setShowBgColorPicker(false);
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        background: color,
                        border: globalColors.background === color ? '2px solid #9333ea' : '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Color */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTextColorPicker(!showTextColorPicker)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Text Color"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={globalColors.text} strokeWidth="2.5">
                <path d="M4 20h4l10.5-10.5a1.5 1.5 0 00-4-4L4 16v4z" />
              </svg>
            </button>
            {showTextColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #e5e7eb',
                  padding: '12px',
                  zIndex: 100
                }}
                onMouseLeave={() => setShowTextColorPicker(false)}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                  Text Color
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9333ea', '#7c3aed', '#dc2626', '#059669', '#0284c7'].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setGlobalColors({ ...globalColors, text: color });
                        setShowTextColorPicker(false);
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        background: color,
                        border: globalColors.text === color ? '2px solid #9333ea' : '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleShare}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              background: globalColors.accent,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Share
          </button>
        </div>
      </div>

      {/* Main Content: Chat + Form side by side */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        height: 'calc(100vh - 80px)',
        minHeight: 0
      }}>
        {/* Collapsed Chat Toggle */}
        {isChatCollapsed && (
          <button
            onClick={() => setIsChatCollapsed(false)}
            style={{
              width: '40px',
              background: '#ffffff',
              border: 'none',
              borderRight: '1px solid #e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px 0'
            }}
            title="Expand chat panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              letterSpacing: '0.05em'
            }}>
              CHAT
            </span>
          </button>
        )}

        {/* Chat Panel */}
        {!isChatCollapsed && (
          <div
            ref={chatPanelRef}
            style={{
              width: `${chatPanelWidth}px`,
              minWidth: '300px',
              maxWidth: '600px',
              borderRight: '1px solid #e5e7eb',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              height: '100%',
              overflow: 'hidden',
              minHeight: 0
            }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={() => setIsResizing(true)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '4px',
                cursor: 'col-resize',
                background: isResizing ? '#9333ea' : 'transparent',
                transition: 'background 0.15s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            />

          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
              <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#000000',
              margin: 0
            }}>
              Form Assistant
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Chat to edit or add questions
            </p>
              </div>
              <button
                onClick={() => setIsChatCollapsed(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Collapse chat panel"
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: 0
          }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: msg.role === 'user' ? '#faf5ff' : '#f9fafb',
                  border: `1px solid ${msg.role === 'user' ? '#e9d5ff' : '#e5e7eb'}`
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: msg.role === 'user' ? '#9333ea' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#000000',
                  lineHeight: '1.5'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Generating form...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e5e7eb',
            background: '#ffffff',
            flexShrink: 0
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              What changes do you need?
            </div>
            <div style={{
              position: 'relative',
              width: '100%'
            }}>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Add a question asking which events guests will attend..."
                disabled={isGenerating}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  maxHeight: '150px',
                  padding: '12px 48px 12px 12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  resize: 'vertical',
                  background: '#ffffff',
                  color: '#1f2937',
                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.15)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#9333ea';
                  e.target.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.15)';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && chatInput.trim() && !isGenerating) {
                    e.preventDefault();
                    handleChatEdit();
                  }
                }}
              />
              <button
                onClick={handleChatEdit}
                disabled={!chatInput.trim() || isGenerating}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  background: (!chatInput.trim() || isGenerating) ? '#d1d5db' : '#9333ea',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!chatInput.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (chatInput.trim() && !isGenerating) {
                    e.currentTarget.style.background = '#7e22ce';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (chatInput.trim() && !isGenerating) {
                    e.currentTarget.style.background = '#9333ea';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isGenerating ? (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Form Edit Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '40px 24px 40px 64px',
          background: globalColors.background,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '100px',
            position: 'relative'
          }}>
          {isGenerating && (!formData.questions || formData.questions.length === 0) ? (
            <LoadingAnimation />
          ) : formData.questions && formData.questions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {formData.questions
                .filter((q: any) => visibleQuestionIds.has(q.id))
                .sort((a: any, b: any) => a.question_order - b.question_order)
                .map((question: any, index: number) => (
                  <React.Fragment key={question.id}>
                    <div
                      style={{
                        padding: '48px 0',
                        borderBottom: index < formData.questions.length - 1 ? `1px solid ${questionColors[question.id]?.border || '#e5e7eb'}` : 'none',
                        position: 'relative',
                        background: questionColors[question.id]?.background || 'transparent',
                        borderRadius: questionColors[question.id]?.background ? '8px' : '0',
                        paddingLeft: questionColors[question.id]?.background ? '24px' : '0',
                        paddingRight: questionColors[question.id]?.background ? '24px' : '0',
                        paddingTop: questionColors[question.id]?.background ? '32px' : '48px',
                        paddingBottom: questionColors[question.id]?.background ? '32px' : '48px'
                      }}
                      onMouseEnter={() => setHoveredQuestion(question.id)}
                      onMouseLeave={() => setHoveredQuestion(null)}
                    >
                      {/* Side Add Button */}
                      <SideAddButton
                        onAdd={() => {
                          setInsertAtIndex(index);
                          setShowComponentPicker(true);
                        }}
                        disabled={isGenerating}
                        position="right"
                      />
                    {/* Question Content - Inline Editable */}
                    <div style={{ marginBottom: '16px' }}>
                      <InlineEditableText
                        value={question.question_text}
                        onChange={(value) => handleInlineQuestionUpdate(question.id, 'question_text', value)}
                        placeholder="Enter question text..."
                        isTitle={true}
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: questionColors[question.id]?.color || globalColors.text,
                          marginBottom: '8px',
                          lineHeight: '1.4'
                        }}
                      />
                      
                      <InlineEditableText
                        value={question.description || ''}
                        onChange={(value) => handleInlineQuestionUpdate(question.id, 'description', value)}
                        placeholder="Add description (optional)"
                        isDescription={true}
                        multiline={true}
                          style={{
                            fontSize: '14px',
                          color: questionColors[question.id]?.color ? `${questionColors[question.id].color}CC` : '#6b7280',
                            lineHeight: '1.5'
                          }}
                      />
                    </div>

                    {/* Editable Options for choice-based questions */}
                    {['multiple_choice', 'checkboxes', 'dropdown', 'multi_select'].includes(question.question_type) && question.settings?.choices && (
                      <div style={{ marginBottom: '16px' }}>
                        <EditableOptions
                          options={question.settings.choices}
                          onChange={(choices) => handleInlineQuestionUpdate(question.id, 'settings.choices', choices)}
                          placeholder="Option"
                        />
                      </div>
                    )}

                    {/* Simple input preview for non-choice questions */}
                    {!['multiple_choice', 'checkboxes', 'dropdown', 'multi_select'].includes(question.question_type) && (
                      <div style={{ marginTop: '8px' }}>
                        {question.question_type === 'short_answer' && (
                          <input
                            type="text"
                            placeholder="Short answer text"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'long_answer' && (
                          <textarea
                            placeholder="Long answer text"
                            disabled
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '12px',
                              fontSize: '15px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af',
                              resize: 'none'
                            }}
                          />
                        )}
                        {question.question_type === 'number' && (
                          <input
                            type="number"
                            placeholder="0"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'email' && (
                          <input
                            type="email"
                            placeholder="email@example.com"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'phone' && (
                          <input
                            type="tel"
                            placeholder="(123) 456-7890"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'link' && (
                          <input
                            type="url"
                            placeholder="https://example.com"
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px 0',
                              fontSize: '15px',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'date' && (
                          <input
                            type="date"
                            disabled
                            style={{
                              width: '200px',
                              padding: '12px 16px',
                              fontSize: '15px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'time' && (
                          <input
                            type="time"
                            disabled
                            style={{
                              width: '150px',
                              padding: '12px 16px',
                              fontSize: '15px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              outline: 'none',
                              background: 'transparent',
                              color: '#9ca3af'
                            }}
                          />
                        )}
                        {question.question_type === 'file_upload' && (
                          <button
                            disabled
                            style={{
                              padding: '12px 24px',
                              fontSize: '15px',
                              fontWeight: '500',
                              color: '#9ca3af',
                              background: 'transparent',
                              border: '1px dashed #d1d5db',
                              borderRadius: '8px',
                              cursor: 'not-allowed'
                            }}
                          >
                            Choose File
                          </button>
                        )}
                        {question.question_type === 'rating' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} style={{ fontSize: '24px', color: '#d1d5db' }}>★</span>
                            ))}
                    </div>
                        )}
                        {question.question_type === 'linear_scale' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[...Array(question.settings?.max_value || 5)].map((_, i) => (
                              <span
                                key={i}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: '#9ca3af'
                                }}
                              >
                                {(question.settings?.min_value || 1) + i}
                              </span>
                            ))}
                          </div>
                        )}
                        {question.question_type === 'signature' && (
                          <div
                            style={{
                              width: '100%',
                              height: '120px',
                              border: '1px dashed #d1d5db',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              fontSize: '14px'
                            }}
                          >
                            Signature area
                          </div>
                        )}
                        {question.question_type === 'payment' && (
                          <div
                            style={{
                              padding: '16px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              color: '#9ca3af',
                              fontSize: '14px'
                            }}
                          >
                            Payment: ${question.settings?.payment_amount || '0.00'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Per-Component Controls (visible on hover) */}
                    {hoveredQuestion === question.id && (
                      <div style={{
                        position: 'absolute',
                        top: '48px',
                        right: '0',
                        display: 'flex',
                        gap: '8px',
                        background: '#ffffff',
                        padding: '8px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e5e7eb'
                      }}>
                        {/* AI Edit Button */}
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowQuestionEditor(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#9333ea',
                            background: '#faf5ff',
                            border: '1px solid #e9d5ff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '500'
                          }}
                          title="Edit with AI"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="14 2 18 6 7 17 3 17 3 13 14 2" />
                          </svg>
                          Edit
                        </button>

                        {/* Condition Button */}
                        <button
                          onClick={() => {
                            setConditionForQuestion(question);
                            setShowConditionModal(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#6b7280',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Add condition"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" />
                            <line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                        </button>

                        {/* Color Picker Button */}
                        <button
                          onClick={() => {
                            setColorPickerForQuestion(question.id);
                            setShowQuestionColorPicker(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#6b7280',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Customize color"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: '#dc2626',
                            background: '#ffffff',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Delete question"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                ))}

                {/* Side Add Button After Last Question */}
                {formData.questions && formData.questions.length > 0 && (
                  <div style={{
                    position: 'relative',
                    padding: '48px 0',
                    marginTop: '24px'
                  }}>
                    <SideAddButton
                      onAdd={() => {
                        setInsertAtIndex(null);
                        setShowComponentPicker(true);
                      }}
                      disabled={isGenerating}
                      position="right"
                    />
                  </div>
                )}

              {/* Submit Button Preview */}
              <div style={{ marginTop: '48px', marginBottom: '40px' }}>
                <button
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: globalColors.accent,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {formData.settings?.submit_button_text || 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#6b7280'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <span style={{ fontSize: '32px', color: '#d1d5db' }}>+</span>
              </div>
              <p style={{ marginBottom: '20px', fontSize: '15px' }}>No questions yet. Start building your form.</p>
              <button
                onClick={() => {
                  setInsertAtIndex(null);
                  setShowComponentPicker(true);
                }}
                disabled={isGenerating}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#ffffff',
                  background: '#9333ea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.5 : 1
                }}
              >
                Add your first question
              </button>
            </div>
          )}
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

      {/* Condition Modal */}
      {showConditionModal && conditionForQuestion && (
        <ConditionModal
          isOpen={showConditionModal}
          onClose={() => {
            setShowConditionModal(false);
            setConditionForQuestion(null);
          }}
          question={conditionForQuestion}
          formQuestions={formData.questions || []}
          onSave={handleSaveCondition}
        />
      )}

      {/* Question Color Picker */}
      {colorPickerForQuestion !== null && (
        <QuestionColorPicker
          questionId={colorPickerForQuestion}
          colors={questionColors[colorPickerForQuestion] || {}}
          onChange={handleQuestionColorChange}
          isOpen={showQuestionColorPicker}
          onClose={() => {
            setShowQuestionColorPicker(false);
            setColorPickerForQuestion(null);
          }}
        />
      )}

      {/* Question Editor Modal */}
      {selectedQuestion && (
        <QuestionEditor
          question={selectedQuestion}
          isOpen={showQuestionEditor}
          onClose={() => {
            setShowQuestionEditor(false);
            setSelectedQuestion(null);
          }}
          onSave={handleSaveQuestion}
          onRegenerate={handleRegenerateQuestion}
        />
      )}

      {/* Component Picker Modal */}
      <ComponentPicker
        isOpen={showComponentPicker}
        onClose={() => {
          setShowComponentPicker(false);
          setInsertAtIndex(null);
        }}
        onSelect={(questionType) => {
          handleAddQuestion(questionType, insertAtIndex);
        }}
        onGenerate={async (prompt) => {
          // Use the chat API to generate the component
          setShowComponentPicker(false);
          setIsGenerating(true);
          setChatMessages(prev => [...prev, { role: 'user', content: prompt }]);
          
          try {
            const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/chat`, {
              method: 'POST',
              headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
              credentials: 'include',
              body: JSON.stringify({ message: prompt })
            });
            
            if (!response.ok) throw new Error('Failed to generate component');
            
            const data = await response.json();
            setChatMessages(prev => [...prev, { role: 'assistant', content: data.changes_made || 'Component added' }]);
            
            // Refresh form data
            const formResponse = await fetch(`${config.backendUrl}/api/forms/${formData.id}`, {
              headers: getAuthHeaders(),
              credentials: 'include'
            });
            
            if (formResponse.ok) {
              const updatedForm = await formResponse.json();
              setFormData(updatedForm);
            }
          } catch (err) {
            console.error('Generate error:', err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Failed to generate component. Please try again.' }]);
          } finally {
            setIsGenerating(false);
          }
        }}
      />
    </div>
  );
};

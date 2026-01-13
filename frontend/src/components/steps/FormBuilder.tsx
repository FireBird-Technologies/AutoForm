import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QuestionEditor } from '../QuestionEditor';
import { LoadingAnimation } from '../LoadingAnimation';
import { ConditionModal } from '../ConditionModal';
import { QuestionColorPicker } from '../ColorPicker';
import { SideAddButton } from '../SideAddButton';
import { InlineEditableText, EditableOptions } from '../InlineEditableText';
import { ComponentPicker } from '../ComponentPicker';
import { useSidebar } from '../../contexts/SidebarContext';
import { config, getAuthHeaders } from '../../config';

interface FormBuilderProps {
  formData: any;
  onBack?: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ formData: initialFormData, onBack }) => {
  const { isOpen: isSidebarOpen } = useSidebar();
  const [formData, setFormData] = useState(initialFormData);
  const [showPublishPopup, setShowPublishPopup] = useState(false);
  const [publishLink, setPublishLink] = useState('');
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
    accent: initialFormData.settings?.accent_color || '#9333ea',
    boldText: initialFormData.settings?.bold_text_color || '#9333ea'
  });
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [chatPanelWidth, setChatPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Auto-minimize chat when sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      setIsChatCollapsed(true);
    }
  }, [isSidebarOpen]);

  // Save global colors to form settings when they change
  useEffect(() => {
    if (formData.id) {
      const currentBg = formData.settings?.background_color || '#ffffff';
      const currentText = formData.settings?.text_color || '#1f2937';
      const currentAccent = formData.settings?.accent_color || '#9333ea';
      const currentBoldText = formData.settings?.bold_text_color || '#9333ea';
      
      // Only update if colors actually changed
      if (
        currentBg !== globalColors.background ||
        currentText !== globalColors.text ||
        currentAccent !== globalColors.accent ||
        currentBoldText !== globalColors.boldText
      ) {
        const updatedSettings = {
          ...formData.settings,
          background_color: globalColors.background,
          text_color: globalColors.text,
          accent_color: globalColors.accent,
          bold_text_color: globalColors.boldText
        };
        
        // Update local state
        setFormData({ ...formData, settings: updatedSettings });
        
        // Save to backend
        saveFormSettings(updatedSettings);
      }
    }
  }, [globalColors.background, globalColors.text, globalColors.accent, globalColors.boldText]);

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
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorMessage = 'Failed to process chat message';
        if (isJson) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        } else {
          errorMessage = `Server error (${response.status}). Please check if the backend is running correctly.`;
        }
        throw new Error(errorMessage);
      }
      
      if (!isJson) {
        throw new Error('Server returned non-JSON response. Please check backend configuration.');
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
        const formContentType = formResponse.headers.get('content-type');
        if (formContentType && formContentType.includes('application/json')) {
          const updatedForm = await formResponse.json();
          setFormData(updatedForm);
        }
      }
    } catch (err: any) {
      console.error('Chat edit error:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't process that request: ${err.message}` }]);
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        let errorMessage = 'Failed to generate form';
        if (isJson) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use status text
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        } else {
          // If not JSON, it's probably an HTML error page
          errorMessage = `Server error (${response.status}). Please check if the backend is running correctly.`;
        }
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error('Server returned non-JSON response. Please check backend configuration.');
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
        // Handle nested settings fields (e.g., 'settings.choices', 'settings.min_value')
        if (field.startsWith('settings.')) {
          const settingKey = field.split('.')[1];
          return { ...q, settings: { ...q.settings, [settingKey]: value } };
        }
        // Handle top-level fields
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

  const handleAddQuestion = async (
    questionType: string, 
    atIndex?: number | null,
    customization?: { text?: string; description?: string; options?: string[]; aiPrompt?: string }
  ) => {
    if (!formData.id) {
      alert('Form must be saved before adding questions');
      return;
    }

    // If AI customization is requested, use the chat API
    if (customization?.aiPrompt) {
      setShowComponentPicker(false);
      setIsGenerating(true);
      const aiMessage = `Add a ${questionType.replace(/_/g, ' ')} question: ${customization.aiPrompt}`;
      setChatMessages(prev => [...prev, { role: 'user', content: aiMessage }]);
      
      try {
        const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/chat`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ message: aiMessage })
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
        console.error('AI generate error:', err);
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Failed to generate component. Please try again.' }]);
      } finally {
        setIsGenerating(false);
      }
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

      // Use customization data if provided
      const questionText = customization?.text || 'New Question';
      const description = customization?.description || '';
      const customOptions = customization?.options?.filter(o => o.trim());

      // Build settings based on question type
      let settings: any = {};
      if (questionType === 'multiple_choice' || questionType === 'checkboxes' || questionType === 'dropdown' || questionType === 'multi_select') {
        settings = { choices: customOptions?.length ? customOptions : ['Option 1', 'Option 2', 'Option 3'] };
      } else if (questionType === 'ranking') {
        settings = { ranking_items: customOptions?.length ? customOptions : ['Item 1', 'Item 2', 'Item 3'] };
      } else if (questionType === 'matrix') {
        settings = { rows: ['Row 1', 'Row 2'], columns: ['Column 1', 'Column 2', 'Column 3'] };
      } else if (questionType === 'linear_scale') {
        settings = { min_value: 1, max_value: 5, scale_min_label: 'Low', scale_max_label: 'High' };
      } else if (questionType === 'rating') {
        settings = { max_value: 5 };
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
          question_text: questionText,
          description: description,
          required: false,
          settings: settings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      await response.json();
      
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

  const handlePublish = async () => {
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/publish`, {
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
        const link = `${window.location.origin}/forms/${data.share_token}`;
        setPublishLink(link);
        setShowPublishPopup(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Publish failed:', errorData);
        alert('Failed to create publish link. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create publish link:', error);
      alert('Failed to create publish link. Please try again.');
    }
  };

  const handlePreview = async () => {
    try {
      // First create/get publish link
      const response = await fetch(`${config.backendUrl}/api/forms/${formData.id}/publish`, {
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
        const previewUrl = `${window.location.origin}/forms/${data.share_token}`;
        window.open(previewUrl, '_blank');
      } else {
        alert('Failed to generate preview. Please try again.');
      }
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to generate preview. Please try again.');
        }
  };

  const copyPublishLink = () => {
    navigator.clipboard.writeText(publishLink);
    alert('Link copied to clipboard!');
  };

  // Evaluate conditional logic to determine which questions to show
  // In builder view, show all questions (conditional logic applies only in public form)
  const visibleQuestionIds = new Set(formData.questions?.map((q: any) => q.id) || []);

  return (
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: globalColors.background,
      overflow: 'hidden'
    }}>
      {/* Top Bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        flexShrink: 0,
        zIndex: 10
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              title="Background Color"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </button>
            {showBgColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  zIndex: 100,
                  width: '280px'
                }}
                onMouseLeave={() => setShowBgColorPicker(false)}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                  Background Color
                </div>
                
                {/* Custom Color Picker */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="color"
                    value={globalColors.background}
                    onChange={(e) => setGlobalColors({ ...globalColors, background: e.target.value })}
                    style={{
                      width: '48px',
                      height: '36px',
                      borderRadius: '6px',
                      border: '2px solid #e5e7eb',
                      cursor: 'pointer'
                    }}
                  />
          <input
            type="text"
                    value={globalColors.background}
                    onChange={(e) => setGlobalColors({ ...globalColors, background: e.target.value })}
                    placeholder="#FFFFFF"
            style={{
              flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase'
            }}
          />
        </div>

                {/* Preset Colors */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#faf5ff', '#fef2f2', '#f0fdf4', '#eff6ff', '#fefce8'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setGlobalColors({ ...globalColors, background: color })}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: color,
                        border: globalColors.background === color ? '2px solid #9333ea' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'transform 0.1s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: globalColors.text
              }}
              title="Text Colors"
            >
              T
            </button>
            {showTextColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  zIndex: 100,
                  width: '280px'
                }}
                onMouseLeave={() => setShowTextColorPicker(false)}
              >
                {/* Normal Text Color */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                    Normal Text
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="color"
                      value={globalColors.text}
                      onChange={(e) => setGlobalColors({ ...globalColors, text: e.target.value })}
                      style={{
                        width: '48px',
                        height: '36px',
                        borderRadius: '6px',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={globalColors.text}
                      onChange={(e) => setGlobalColors({ ...globalColors, text: e.target.value })}
                      placeholder="#000000"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9333ea', '#7c3aed', '#dc2626', '#059669', '#0284c7'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setGlobalColors({ ...globalColors, text: color })}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          background: color,
                          border: globalColors.text === color ? '2px solid #9333ea' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>

                {/* Bold/Button Color */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                    Bold & Button Color
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="color"
                      value={globalColors.boldText || '#9333ea'}
                      onChange={(e) => setGlobalColors({ ...globalColors, boldText: e.target.value })}
                      style={{
                        width: '48px',
                        height: '36px',
                        borderRadius: '6px',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
          />
                    <input
                      type="text"
                      value={globalColors.boldText || '#9333ea'}
                      onChange={(e) => setGlobalColors({ ...globalColors, boldText: e.target.value })}
                      placeholder="#9333EA"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {['#9333ea', '#7c3aed', '#a855f7', '#c084fc', '#3b82f6', '#0284c7', '#10b981', '#059669', '#dc2626', '#f59e0b'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setGlobalColors({ ...globalColors, boldText: color })}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          background: color,
                          border: (globalColors.boldText || '#9333ea') === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'transform 0.1s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
        </div>

          <button
            onClick={handlePublish}
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
            Publish
          </button>
        </div>
      </div>

      {/* Main Content: Chat + Form side by side */}
      <div style={{
        flex: '1 1 0',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
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
              position: 'relative',
              height: '100%',
              flexShrink: 0,
              overflow: 'hidden'
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

            {/* Header - Fixed at top */}
          <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              background: '#ffffff',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
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

            {/* Chat Messages - Scrollable middle area */}
          <div style={{
              position: 'absolute',
              top: '70px',
              left: 0,
              right: 0,
              bottom: '130px',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px 20px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  marginBottom: '6px'
                }}>
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#000000',
                  lineHeight: '1.6'
                }}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <div style={{ margin: '0 0 8px 0' }}>{children}</div>,
                      strong: ({ children }) => <strong style={{ fontWeight: '600', color: globalColors.boldText || '#9333ea' }}>{children}</strong>,
                      em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                      code: ({ children }) => (
                        <code style={{
                          background: '#f3f4f6',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}>
                          {children}
                        </code>
                      ),
                      ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ol>,
                      li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>
                    }}
                  >
                  {msg.content}
                  </ReactMarkdown>
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
          </div>

            {/* Chat Input - Fixed at bottom */}
          <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 20px 16px',
            borderTop: '1px solid #e5e7eb',
            background: '#ffffff',
              zIndex: 5
          }}>
            <div style={{
                fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px'
            }}>
              What changes do you need?
            </div>
              <div style={{ position: 'relative' }}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe changes..."
              disabled={isGenerating}
              style={{
                width: '100%',
                    height: '60px',
                    padding: '10px 44px 10px 12px',
                    fontSize: '14px',
                fontFamily: 'inherit',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                outline: 'none',
                resize: 'none',
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
          padding: '0',
          background: globalColors.background,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Form Title & Description - Sticky at top */}
          <div style={{
            position: 'sticky',
            top: 0,
            background: globalColors.background,
            zIndex: 5,
            padding: '40px 24px 24px 64px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              width: '100%'
            }}>
              <InlineEditableText
                value={formData.title || 'Untitled Form'}
                onChange={(value) => setFormData({ ...formData, title: value })}
                placeholder="Form title"
                isTitle={true}
                boldTextColor={globalColors.boldText || '#9333ea'}
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: globalColors.text,
                  lineHeight: '1.2',
                  marginBottom: '8px',
                  display: 'block'
                }}
              />
              {formData.description && (
                <InlineEditableText
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Add form description..."
                  multiline={true}
                  boldTextColor={globalColors.boldText || '#9333ea'}
                  style={{
                    fontSize: '16px',
                    color: globalColors.text,
                    opacity: 0.7,
                    lineHeight: '1.5'
                  }}
                />
              )}
              {!formData.description && (
                <div
                  onClick={() => {
                    // Add description on click
                    const newDesc = prompt('Add form description:') || '';
                    if (newDesc) {
                      setFormData({ ...formData, description: newDesc });
                    }
                  }}
                  style={{
                    fontSize: '16px',
                    color: globalColors.text,
                    opacity: 0.4,
                    lineHeight: '1.5',
                    cursor: 'pointer',
                    fontStyle: 'italic'
                  }}
                >
                  Add description...
                </div>
              )}
            </div>
          </div>

          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '0 24px 100px 64px',
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
                        boldTextColor={globalColors.boldText || '#9333ea'}
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
                        boldTextColor={globalColors.boldText || '#9333ea'}
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
                    
                    {/* Editable Options for ranking items */}
                    {question.question_type === 'ranking' && question.settings?.ranking_items && (
                      <div style={{ marginBottom: '16px' }}>
                        <EditableOptions
                          options={question.settings.ranking_items}
                          onChange={(items) => handleInlineQuestionUpdate(question.id, 'settings.ranking_items', items)}
                          placeholder="Item"
                        />
                      </div>
                    )}
                    
                    {/* Editable Matrix as a visual table */}
                    {question.question_type === 'matrix' && (
                      <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'separate',
                          borderSpacing: '0',
                          fontSize: '14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <thead>
                            <tr>
                              <th style={{
                                padding: '12px',
                                background: '#f9fafb',
                                borderBottom: '2px solid #e5e7eb',
                                borderRight: '2px solid #e5e7eb',
                                minWidth: '120px'
                              }}></th>
                              {(question.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((col: string, idx: number) => (
                                <th key={idx} style={{
                                  padding: '8px',
                                  background: '#f9fafb',
                                  borderBottom: '2px solid #e5e7eb',
                                  borderRight: idx < (question.settings?.columns || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                  minWidth: '150px'
                                }}>
                                  <input
                                    type="text"
                                    value={col}
                                    onChange={(e) => {
                                      const newColumns = [...(question.settings?.columns || [])];
                                      newColumns[idx] = e.target.value;
                                      handleInlineQuestionUpdate(question.id, 'settings.columns', newColumns);
                                    }}
                                    placeholder="Column name"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#374151',
                                      border: '1px solid transparent',
                                      borderRadius: '4px',
                                      outline: 'none',
                                      background: 'transparent',
                                      textAlign: 'center'
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = globalColors.boldText || '#9333ea';
                                      e.currentTarget.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = 'transparent';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const newColumns = (question.settings?.columns || []).filter((_: string, i: number) => i !== idx);
                                      if (newColumns.length > 0) {
                                        handleInlineQuestionUpdate(question.id, 'settings.columns', newColumns);
                                      }
                                    }}
                                    style={{
                                      marginTop: '4px',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      color: '#ef4444',
                                      background: 'transparent',
                                      border: '1px solid #fee2e2',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    Remove
                                  </button>
                                </th>
                              ))}
                              <th style={{
                                padding: '8px',
                                background: '#f9fafb',
                                borderBottom: '2px solid #e5e7eb',
                                width: '60px',
                                textAlign: 'center'
                              }}>
                                <button
                                  onClick={() => {
                                    const newColumns = [...(question.settings?.columns || []), `Column ${(question.settings?.columns || []).length + 1}`];
                                    handleInlineQuestionUpdate(question.id, 'settings.columns', newColumns);
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: globalColors.boldText || '#9333ea',
                                    background: 'transparent',
                                    border: `1px dashed ${globalColors.boldText || '#9333ea'}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = `${globalColors.boldText || '#9333ea'}10`}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  + Col
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(question.settings?.rows || ['Row 1', 'Row 2']).map((row: string, rowIdx: number) => (
                              <tr key={rowIdx}>
                                <td style={{
                                  padding: '8px 12px',
                                  background: '#f9fafb',
                                  borderRight: '2px solid #e5e7eb',
                                  borderBottom: rowIdx < (question.settings?.rows || []).length - 1 ? '1px solid #e5e7eb' : 'none'
                                }}>
                                  <input
                                    type="text"
                                    value={row}
                                    onChange={(e) => {
                                      const newRows = [...(question.settings?.rows || [])];
                                      newRows[rowIdx] = e.target.value;
                                      handleInlineQuestionUpdate(question.id, 'settings.rows', newRows);
                                    }}
                                    placeholder="Row name"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      color: '#374151',
                                      border: '1px solid transparent',
                                      borderRadius: '4px',
                                      outline: 'none',
                                      background: 'transparent'
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = globalColors.boldText || '#9333ea';
                                      e.currentTarget.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = 'transparent';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const newRows = (question.settings?.rows || []).filter((_: string, i: number) => i !== rowIdx);
                                      if (newRows.length > 0) {
                                        handleInlineQuestionUpdate(question.id, 'settings.rows', newRows);
                                      }
                                    }}
                                    style={{
                                      marginTop: '4px',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      color: '#ef4444',
                                      background: 'transparent',
                                      border: '1px solid #fee2e2',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    Remove
                                  </button>
                                </td>
                                {(question.settings?.columns || []).map((_: string, colIdx: number) => (
                                  <td key={colIdx} style={{
                                    padding: '12px',
                                    borderRight: colIdx < (question.settings?.columns || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                    borderBottom: rowIdx < (question.settings?.rows || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                    textAlign: 'center',
                                    background: '#ffffff'
                                  }}>
                                    <input
                                      type="radio"
                                      disabled
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        accentColor: globalColors.boldText || '#9333ea',
                                        cursor: 'not-allowed'
                                      }}
                                    />
                                  </td>
                                ))}
                                <td style={{
                                  padding: '8px',
                                  borderBottom: rowIdx < (question.settings?.rows || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                                  textAlign: 'center',
                                  background: '#ffffff'
                                }}></td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={(question.settings?.columns || []).length + 2} style={{
                                padding: '8px',
                                textAlign: 'center',
                                background: '#f9fafb'
                              }}>
                                <button
                                  onClick={() => {
                                    const newRows = [...(question.settings?.rows || []), `Row ${(question.settings?.rows || []).length + 1}`];
                                    handleInlineQuestionUpdate(question.id, 'settings.rows', newRows);
                                  }}
                                  style={{
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: globalColors.boldText || '#9333ea',
                                    background: 'transparent',
                                    border: `1px dashed ${globalColors.boldText || '#9333ea'}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = `${globalColors.boldText || '#9333ea'}10`}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  + Add Row
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Editable Settings for linear scale */}
                    {question.question_type === 'linear_scale' && (
                      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              Min Value
                            </div>
                            <input
                              type="number"
                              value={question.settings?.min_value ?? ''}
                              onChange={(e) => {
                                // Allow temporary empty value while editing
                                const val = e.target.value;
                                if (val === '') {
                                  // Store empty temporarily to allow user to clear field
                                  const updatedQuestions = formData.questions.map((q: any) => {
                                    if (q.id === question.id) {
                                      return { ...q, settings: { ...q.settings, min_value: '' } };
                                    }
                                    return q;
                                  });
                                  setFormData({ ...formData, questions: updatedQuestions });
                                } else {
                                  const numVal = parseInt(val);
                                  if (!isNaN(numVal)) {
                                    handleInlineQuestionUpdate(question.id, 'settings.min_value', numVal);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Restore to default if empty on blur
                                if (e.target.value === '' || e.target.value === null) {
                                  handleInlineQuestionUpdate(question.id, 'settings.min_value', 1);
                                }
                                e.currentTarget.style.borderColor = '#e5e7eb';
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = globalColors.boldText || '#9333ea'}
                              placeholder="1"
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              Max Value
                            </div>
                            <input
                              type="number"
                              value={question.settings?.max_value ?? ''}
                              onChange={(e) => {
                                // Allow temporary empty value while editing
                                const val = e.target.value;
                                if (val === '') {
                                  // Store empty temporarily to allow user to clear field
                                  const updatedQuestions = formData.questions.map((q: any) => {
                                    if (q.id === question.id) {
                                      return { ...q, settings: { ...q.settings, max_value: '' } };
                                    }
                                    return q;
                                  });
                                  setFormData({ ...formData, questions: updatedQuestions });
                                } else {
                                  const numVal = parseInt(val);
                                  if (!isNaN(numVal)) {
                                    handleInlineQuestionUpdate(question.id, 'settings.max_value', numVal);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Restore to default if empty on blur
                                if (e.target.value === '' || e.target.value === null) {
                                  handleInlineQuestionUpdate(question.id, 'settings.max_value', 5);
                                }
                                e.currentTarget.style.borderColor = '#e5e7eb';
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = globalColors.boldText || '#9333ea'}
                              placeholder="5"
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              Min Label (optional)
                            </div>
                            <input
                              type="text"
                              value={question.settings?.scale_min_label || ''}
                              onChange={(e) => handleInlineQuestionUpdate(question.id, 'settings.scale_min_label', e.target.value)}
                              placeholder="e.g., Low"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = globalColors.boldText || '#9333ea'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                              Max Label (optional)
                            </div>
                            <input
                              type="text"
                              value={question.settings?.scale_max_label || ''}
                              onChange={(e) => handleInlineQuestionUpdate(question.id, 'settings.scale_max_label', e.target.value)}
                              placeholder="e.g., High"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none'
                              }}
                              onFocus={(e) => e.currentTarget.style.borderColor = globalColors.boldText || '#9333ea'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple input preview for non-choice questions */}
                    {!['multiple_choice', 'checkboxes', 'dropdown', 'multi_select', 'ranking', 'matrix'].includes(question.question_type) && (
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
                        {question.question_type === 'linear_scale' && (() => {
                          const minVal = question.settings?.min_value || 1;
                          const maxVal = question.settings?.max_value || 5;
                          const range = maxVal - minVal + 1;
                          const useSlider = range > 10;
                          
                          return useSlider ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                              <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '30px' }}>{minVal}</span>
                              <input
                                type="range"
                                min={minVal}
                                max={maxVal}
                                disabled
                                style={{
                                  flex: 1,
                                  height: '6px',
                                  borderRadius: '3px',
                                  background: '#e5e7eb',
                                  cursor: 'not-allowed',
                                  accentColor: globalColors.boldText || '#9333ea'
                                }}
                              />
                              <span style={{ fontSize: '13px', color: '#9ca3af', minWidth: '30px', textAlign: 'right' }}>{maxVal}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {[...Array(range)].map((_, i) => (
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
                                  {minVal + i}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
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
                        {question.question_type === 'matrix' && (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '14px'
                            }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }}></th>
                                  {(question.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((col: string, idx: number) => (
                                    <th key={idx} style={{ padding: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontWeight: '500' }}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(question.settings?.rows || ['Row 1', 'Row 2']).map((row: string, rowIdx: number) => (
                                  <tr key={rowIdx}>
                                    <td style={{ padding: '8px', border: '1px solid #e5e7eb', color: '#6b7280', fontWeight: '500' }}>
                                      {row}
                                    </td>
                                    {(question.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((_: string, colIdx: number) => (
                                      <td key={colIdx} style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                        <input
                                          type="radio"
                                          disabled
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            accentColor: globalColors.boldText || '#9333ea',
                                            cursor: 'not-allowed'
                                          }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {question.question_type === 'ranking' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(question.settings?.ranking_items || ['Item 1', 'Item 2', 'Item 3']).map((item: string, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '12px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#ffffff'
                                }}
                              >
                                <span style={{
                                  minWidth: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: globalColors.boldText || '#9333ea',
                                  background: `${globalColors.boldText || '#9333ea'}10`,
                                  borderRadius: '4px'
                                }}>
                                  {idx + 1}
                                </span>
                                <span style={{
                                  flex: 1,
                                  fontSize: '15px',
                                  color: '#6b7280'
                                }}>
                                  {item}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    disabled
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '16px',
                                      color: '#d1d5db',
                                      background: 'transparent',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '4px',
                                      cursor: 'not-allowed'
                                    }}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    disabled
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '16px',
                                      color: '#d1d5db',
                                      background: 'transparent',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '4px',
                                      cursor: 'not-allowed'
                                    }}
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            ))}
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
                    background: globalColors.boldText || globalColors.accent,
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

      {/* Publish Popup */}
      {showPublishPopup && (
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
              Publish Your Form
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
                value={publishLink}
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
                onClick={copyPublishLink}
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
              onClick={() => setShowPublishPopup(false)}
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
        onSelect={(questionType, customization) => {
          handleAddQuestion(questionType, insertAtIndex, customization);
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

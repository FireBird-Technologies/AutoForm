import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { config, getAuthHeaders } from './config';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Landing } from './components/Landing';
import { Account } from './components/Account';
import { PricingPage } from './pages/PricingPage';
import { SubscriptionResult } from './pages/SubscriptionResult';
import { PublicForm } from './pages/PublicForm';
import { FormResponsesNew as FormResponses } from './pages/FormResponsesNew';
import { FormAnalyticsNew as FormAnalytics } from './pages/FormAnalyticsNew';
import { FormPlanner } from './components/steps/FormPlanner';
import { FormBuilder } from './components/steps/FormBuilder';
import { CreditsProvider } from './contexts/CreditsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { NewYearBanner } from './components/NewYearBanner';

function AuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    
    if (token && sessionStorage.getItem('auth_callback')) {
      localStorage.setItem('auth_token', token);
      sessionStorage.removeItem('auth_callback');
      
      // Check if there's a redirect URL stored
      const redirectTo = sessionStorage.getItem('auth_redirect_to');
      if (redirectTo) {
        sessionStorage.removeItem('auth_redirect_to');
        navigate(redirectTo, { replace: true });
      } else {
        navigate('/build', { replace: true });
      }
    }
  }, [navigate, location]);

  return null;
}

function FormBuilderPage() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check if we're loading an existing form from sidebar
  useEffect(() => {
    const state = location.state as any;
    if (state?.formId) {
      loadExistingForm(state.formId);
    }
  }, [location.state]);

  const loadExistingForm = async (formId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.backendUrl}/api/forms/${formId}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Failed to load form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormPlanner
            onComplete={(data) => {
              setFormData(data);
              setCurrentStep(1);
            }}
          />
        );
      case 1:
        return (
          <FormBuilder
            formData={formData}
            onBack={() => setCurrentStep(0)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {renderStep()}
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('auth_token');
  
  // Paths that should show sidebar
  const showSidebar = isAuthenticated && ![
    '/',
    '/pricing',
    '/subscription',
    '/account'
  ].includes(location.pathname) && !location.pathname.startsWith('/public/');

  return (
    <>
      <AuthHandler />
      <NewYearBanner />
      <Navbar onAccountClick={() => navigate('/account')} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
        {showSidebar && <Sidebar />}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Landing onStart={() => navigate('/build')} />} />
          
          {/* Form Builder Routes */}
          <Route 
            path="/build" 
            element={
              isAuthenticated ? (
                <FormBuilderPage />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/forms/:formId/responses" 
            element={
              isAuthenticated ? (
                <FormResponses />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/forms/:formId/analytics" 
            element={
              isAuthenticated ? (
                <FormAnalytics />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          {/* Public Form Submission */}
          <Route 
            path="/forms/:token" 
            element={<PublicForm />}
          />
          
          {/* Legacy routes - redirect to /build */}
          <Route path="/visualize" element={<Navigate to="/build" replace />} />
          <Route path="/shared/:token" element={<Navigate to="/build" replace />} />
          
          {/* Account & Pricing */}
          <Route 
            path="/account" 
            element={
              isAuthenticated ? (
                <Account onClose={() => navigate(-1)} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/pricing" 
            element={<PricingPage />}
          />
          <Route 
            path="/subscription" 
            element={<SubscriptionResult />}
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <NotificationProvider>
        <SidebarProvider>
          <CreditsProvider>
            <div className="app-container">
              <AppRoutes />
            </div>
          </CreditsProvider>
        </SidebarProvider>
      </NotificationProvider>
    </Router>
  );
}
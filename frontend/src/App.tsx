import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './components/Landing';
import { Account } from './components/Account';
import { BuildPage } from './pages/BuildPage';
import { PricingPage } from './pages/PricingPage';
import { SubscriptionResult } from './pages/SubscriptionResult';
import { PublicFormView } from './pages/PublicFormView';
import { PublicForm } from './pages/PublicForm';
import { FormResponses } from './pages/FormResponses';
import { FormPlanner } from './components/steps/FormPlanner';
import { FormBuilder } from './components/steps/FormBuilder';
import { CreditsProvider } from './contexts/CreditsContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>(null);

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
  const isAuthenticated = !!localStorage.getItem('auth_token');

  return (
    <>
      <AuthHandler />
      <NewYearBanner />
      <Navbar onAccountClick={() => navigate('/account')} />
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
          
          {/* Public Form Submission */}
          <Route 
            path="/public/forms/:token" 
            element={<PublicForm />}
          />
          
          {/* Build Routes */}
          <Route 
            path="/build" 
            element={
              isAuthenticated ? (
                <BuildPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* Legacy route - redirect to /build */}
          <Route path="/visualize" element={<Navigate to="/build" replace />} />
          <Route 
            path="/shared/:token" 
            element={<PublicFormView />}
          />
          
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
    </>
  );
}

export default function App() {
  return (
    <Router>
      <NotificationProvider>
        <CreditsProvider>
      <div className="app-container">
        <AppRoutes />
      </div>
        </CreditsProvider>
      </NotificationProvider>
    </Router>
  );
}
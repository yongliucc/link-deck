import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import SessionExpiredNotification from './components/SessionExpiredNotification';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Login from './pages/Login';

// Create a client
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <>
      <SessionExpiredNotification />
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

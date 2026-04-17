import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import Repo from './pages/Repo';
import Diff from './pages/Diff';
import Success from './pages/Success';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // or a tiny loader
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="app-container"
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/repo" element={<ProtectedRoute><PageWrapper><Repo /></PageWrapper></ProtectedRoute>} />
          <Route path="/diff" element={<ProtectedRoute><PageWrapper><Diff /></PageWrapper></ProtectedRoute>} />
          <Route path="/success" element={<ProtectedRoute><PageWrapper><Success /></PageWrapper></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;

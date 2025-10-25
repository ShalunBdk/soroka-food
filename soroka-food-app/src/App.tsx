import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';

// Admin imports
import AdminLayout from './components/AdminLayout/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminRecipes from './pages/admin/AdminRecipes';
import RecipeForm from './pages/admin/RecipeForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminComments from './pages/admin/AdminComments';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminSettings from './pages/admin/AdminSettings';

import { tokenManager } from './services/api';
import './App.css';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = tokenManager.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
}

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          } />
          <Route path="/recipe/:id" element={
            <>
              <Header />
              <RecipeDetail />
              <Footer />
            </>
          } />
          <Route path="/recipes" element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          } />

          {/* Admin login route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/recipes" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminRecipes />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/recipes/new" element={
            <ProtectedRoute>
              <AdminLayout>
                <RecipeForm />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/recipes/:id/edit" element={
            <ProtectedRoute>
              <AdminLayout>
                <RecipeForm />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminCategories />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/comments" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminComments />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/newsletter" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminNewsletter />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

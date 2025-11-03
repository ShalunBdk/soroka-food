import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import CategoryPage from './pages/CategoryPage';
import CuisinePage from './pages/CuisinePage';
import SearchResults from './pages/SearchResults';
import BestRecipes from './pages/BestRecipes';
import About from './pages/About';
import Contact from './pages/Contact';
import Rules from './pages/Rules';
import Advertising from './pages/Advertising';

// Admin imports
import AdminLayout from './components/AdminLayout/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminRecipes from './pages/admin/AdminRecipes';
import RecipeForm from './pages/admin/RecipeForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminTags from './pages/admin/AdminTags';
import AdminComments from './pages/admin/AdminComments';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStaticPages from './pages/admin/AdminStaticPages';
import AdminUsers from './pages/admin/AdminUsers';
import UserForm from './pages/admin/UserForm';
import AdminSpamFilter from './pages/admin/AdminSpamFilter';
import AdminLogs from './pages/admin/AdminLogs';

import { tokenManager } from './services/api';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = tokenManager.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
}

function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
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
          <Route path="/category/:slug" element={
            <>
              <Header />
              <CategoryPage />
              <Footer />
            </>
          } />
          <Route path="/cuisine/:type" element={
            <>
              <Header />
              <CuisinePage />
              <Footer />
            </>
          } />
          <Route path="/search" element={
            <>
              <Header />
              <SearchResults />
              <Footer />
            </>
          } />
          <Route path="/best" element={
            <>
              <Header />
              <BestRecipes />
              <Footer />
            </>
          } />
          <Route path="/about" element={
            <>
              <Header />
              <About />
              <Footer />
            </>
          } />
          <Route path="/contact" element={
            <>
              <Header />
              <Contact />
              <Footer />
            </>
          } />
          <Route path="/rules" element={
            <>
              <Header />
              <Rules />
              <Footer />
            </>
          } />
          <Route path="/advertising" element={
            <>
              <Header />
              <Advertising />
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
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/new" element={
            <ProtectedRoute>
              <AdminLayout>
                <UserForm />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:id/edit" element={
            <ProtectedRoute>
              <AdminLayout>
                <UserForm />
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
          <Route path="/admin/tags" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminTags />
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
          <Route path="/admin/static-pages" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminStaticPages />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/spam-filter" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminSpamFilter />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminLogs />
              </AdminLayout>
            </ProtectedRoute>
          } />
          </Routes>
        </div>
      </Router>
      </ToastProvider>
    </SettingsProvider>
  );
}

export default App;

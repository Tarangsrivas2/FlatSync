import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import FindFlat from './pages/FindFlat';
import ListFlat from './pages/ListFlat';
import Profile from './pages/Profile';
import { useState } from 'react';
import AuthModals from './components/AuthModals';
import Chats from './pages/Chats';
import './leafletConfig';

function AppContent() {
  const [authModal, setAuthModal] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        onLoginClick={() => setAuthModal('login')}
        onRegisterClick={() => setAuthModal('register')}
      />
      {authModal && (
        <AuthModals type={authModal} onClose={() => setAuthModal(null)} />
      )}

      <main className="flex-1 mt-16 flex flex-col">
        <Routes>
          <Route path="/" element={<Home onRegisterClick={() => setAuthModal('register')} />} />

          <Route element={<PrivateRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/find-flat" element={<FindFlat defaultView="map" />} />
            <Route path="/browse" element={<FindFlat defaultView="browse" />} />
            <Route path="/matches" element={<FindFlat defaultView="matches" />} />
            <Route path="/map" element={<FindFlat defaultView="map" />} />
            <Route path="/list-flat" element={<ListFlat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/chats/:receiverId" element={<Chats />} />
          </Route>
        </Routes>
      </main>

      <Toaster position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
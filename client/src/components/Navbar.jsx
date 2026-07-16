import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bell, LogOut, PlusCircle, MessageCircle, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import fsLogo from '../assets/FS Logo.png';

const Navbar = ({ onLoginClick, onRegisterClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, setNotifications } = useSocket();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const navRef = useRef(null);

  // Theme support
  const [theme, setTheme] = useState(
    localStorage.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useGSAP(() => {
    gsap.from(navRef.current, {
      y: -100, opacity: 0, duration: 0.8, ease: "back.out(1.7)"
    });
    gsap.from(".nav-item", {
      y: -20, opacity: 0, duration: 0.5, stagger: 0.1, delay: 0.4, ease: "power2.out"
    });
  }, { scope: navRef });

  useEffect(() => {
    if (!isAuthenticated || !showDropdown) return;

    const fetchAll = async () => {
      try {
        // Incoming requests (User B sees these)
        const incomingRes = await api.get('/requests/incoming');
        setPendingRequests(incomingRes.data.filter(r => r.status === 'pending'));

        // ✅ Accepted from BOTH sides — User B's accepted incoming + User A's accepted outgoing
        const incoming = incomingRes.data.filter(r => r.status === 'accepted');

        // Outgoing requests that got accepted (User A sees these)
        const outgoingRes = await api.get('/requests/outgoing');
        const outgoing = outgoingRes.data.filter(r => r.status === 'accepted');

        // Merge both and deduplicate by the other person's ID
        const seen = new Set();
        const merged = [];

        // For incoming accepted — other person is fromUser
        incoming.forEach(r => {
          const otherId = r.fromUser._id;
          if (!seen.has(otherId)) {
            seen.add(otherId);
            merged.push({ _id: r._id, otherUser: r.fromUser });
          }
        });

        // For outgoing accepted — other person is toUser
        outgoing.forEach(r => {
          const otherId = r.toUser._id;
          if (!seen.has(otherId)) {
            seen.add(otherId);
            merged.push({ _id: r._id, otherUser: r.toUser });
          }
        });

        setAcceptedConnections(merged);
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      }
    };

    fetchAll();
  }, [showDropdown, isAuthenticated]);

  const handleAccept = async (id) => {
    try {
      await api.put(`/requests/${id}/accept`);
      toast.success('Request accepted');

      // Move from pending to connections
      const justAccepted = pendingRequests.find(r => r._id === id);
      if (justAccepted) {
        const otherId = justAccepted.fromUser._id;
        setAcceptedConnections(prev => {
          const alreadyThere = prev.find(c => c.otherUser._id === otherId);
          if (alreadyThere) return prev;
          return [...prev, { _id: id, otherUser: justAccepted.fromUser }];
        });
      }

      setPendingRequests(prev => prev.filter(r => r._id !== id));
      setNotifications(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to accept');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/requests/${id}/reject`);
      toast.success('Request rejected');
      setPendingRequests(prev => prev.filter(r => r._id !== id));
      setNotifications(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to reject');
    }
  };

  const openChat = (otherUserId) => {
    setShowDropdown(false);
    navigate(`/chats/${otherUserId}`);
  };

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 h-16 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-gray-100/50 dark:border-zinc-800/50 shadow-sm z-50 px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-2 nav-item">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={fsLogo} alt="FlatSync Logo" className="w-8 h-8 object-contain rounded-lg transition-transform group-hover:scale-105" />
          <span className="text-xl font-black tracking-tight text-primary-600 dark:text-primary-500 drop-shadow-sm">FlatSync</span>
        </Link>
      </div>

      <div className="flex items-center gap-4 nav-item">
        <Link to="/" className="nav-item-animated text-gray-700 dark:text-zinc-300 font-semibold transition-colors">
          Home
        </Link>
        {/* Navigation items switch based on login status */}
        {!isAuthenticated ? (
          <>
            <a href="/#about" className="nav-item-animated text-gray-700 dark:text-zinc-300 font-semibold transition-colors">
              About
            </a>
            <a href="/#contact" className="nav-item-animated text-gray-700 dark:text-zinc-300 font-semibold transition-colors">
              Contact
            </a>
          </>
        ) : (
          <>
            <Link to="/browse" className="nav-item-animated text-gray-700 dark:text-zinc-300 font-semibold transition-colors">
              Browse
            </Link>
            <Link to="/matches" className="nav-item-animated text-gray-700 dark:text-zinc-300 font-semibold transition-colors">
              Matches
            </Link>
            <Link to="/chats" className="nav-item-animated text-gray-700 dark:text-zinc-300 font-semibold transition-colors">
              Messages
            </Link>
            <Link to="/map" className="nav-item-animated text-gray-700 dark:text-zinc-300 font-semibold transition-colors">
              Map
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 relative nav-item">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-primary-500" /> : <Moon className="w-5 h-5" />}
        </button>

        {isAuthenticated ? (
          <>
            <div className="relative cursor-pointer hover:scale-110 transition-transform" onClick={() => setShowDropdown(!showDropdown)}>
              <Bell className="w-6 h-6 text-gray-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-500 transition" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm shadow-rose-500/50">
                  {notifications}
                </span>
              )}
            </div>

            {showDropdown && (
              <div className="absolute top-12 right-0 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-100 dark:border-zinc-800 shadow-2xl rounded-xl p-4 flex flex-col gap-3 transform transition-all duration-200 origin-top-right max-h-[80vh] overflow-y-auto">

                {/* ── PENDING REQUESTS ── */}
                <h4 className="font-bold text-gray-800 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-2">Incoming Requests</h4>
                {pendingRequests.length === 0
                  ? <p className="text-sm text-gray-500 dark:text-zinc-400">No new requests</p>
                  : pendingRequests.map(req => (
                    <div key={req._id} className="flex gap-3 items-center p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-zinc-700">
                      <img src={req.fromUser.photoUrl || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-zinc-100">{req.fromUser.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{req.listingId?.fullName}'s listing</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handleAccept(req._id)} className="bg-primary-500 hover:bg-primary-600 text-white text-xs px-2 py-1 rounded transition shadow-sm font-semibold">Accept</button>
                        <button onClick={() => handleReject(req._id)} className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs px-2 py-1 rounded transition">Reject</button>
                      </div>
                    </div>
                  ))
                }

                {/* ── ACCEPTED CONNECTIONS — BOTH USER A AND USER B SEE THIS ── */}
                {acceptedConnections.length > 0 && (
                  <>
                    <h4 className="font-bold text-gray-800 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-2 mt-2">💬 Your Connections</h4>
                    {acceptedConnections.map(conn => (
                      <div key={conn._id} className="flex gap-3 items-center p-2 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors border border-transparent hover:border-amber-100 dark:hover:border-amber-900/40">
                        <img src={conn.otherUser.photoUrl || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-gray-900 dark:text-zinc-100">{conn.otherUser.name}</p>
                          <p className="text-xs text-primary-600 dark:text-primary-400">Connected ✓</p>
                        </div>
                        <button
                          onClick={() => openChat(conn.otherUser._id)}
                          className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white text-xs px-2 py-1.5 rounded-lg transition shadow-sm font-semibold"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Chat
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 py-1.5 px-2.5 rounded-full transition-all group">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold group-hover:scale-105 transition-transform">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-sm text-gray-700 dark:text-zinc-300 hidden sm:block">{user.name}</span>
            </Link>
            <button onClick={() => { logout(); navigate('/'); }} className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <button onClick={onLoginClick} className="text-gray-700 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 font-semibold px-4 py-2 transition-colors">Login</button>
            <button onClick={onRegisterClick} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-0.5">Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
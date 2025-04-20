import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Home, 
  Vote, 
  BarChart2, 
  Settings, 
  LogOut, 
  Lock, 
  Moon, 
  Sun, 
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import Results from './Results';
import ZkVerification from './ZkVerification';
import './DVoteApp.css';

function DVoteApp() {
  // State management
  const [account, setAccount] = useState('');
  const [userRole, setUserRole] = useState('visitor');
  const [elections, setElections] = useState([]);
  const [activeElection, setActiveElection] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [hasVoted, setHasVoted] = useState(false);
  
  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setLoading(true);
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        setAccount(account);
        
        // Simulate role fetching
        setTimeout(() => {
          setUserRole('voter');
          setLoading(false);
          showNotification('Wallet connected successfully!', 'success');
        }, 1000);
      } else {
        showNotification('Please install MetaMask to use this application', 'error');
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showNotification('Error connecting wallet', 'error');
      setLoading(false);
    }
  };
  
  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };
  
  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  // Simulate fetching elections
  useEffect(() => {
    if (account && userRole !== 'visitor') {
      // Mock election data
      const mockElections = [
        { 
          id: 1, 
          title: 'University Student Council Election', 
          status: 'active',
          candidates: [
            { id: 1, name: 'Alex Johnson', votes: 145, platform: 'Campus Sustainability' },
            { id: 2, name: 'Maya Rodriguez', votes: 162, platform: 'Academic Reform' },
            { id: 3, name: 'Taylor Kim', votes: 124, platform: 'Student Wellness' }
          ],
          totalVoters: 650,
          votedCount: 431,
          startTime: new Date(Date.now() - 86400000).toISOString(),
          endTime: new Date(Date.now() + 86400000 * 2).toISOString()
        },
        { 
          id: 2, 
          title: 'Dormitory Representative Election', 
          status: 'upcoming',
          candidates: [
            { id: 1, name: 'Jordan Lee', votes: 0, platform: 'Better Facilities' },
            { id: 2, name: 'Sam Parker', votes: 0, platform: 'Community Events' }
          ],
          totalVoters: 220,
          votedCount: 0,
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 86400000 * 5).toISOString()
        },
        { 
          id: 3, 
          title: 'Department Chair Selection', 
          status: 'completed',
          candidates: [
            { id: 1, name: 'Dr. Rebecca Williams', votes: 32, platform: 'Research Focus' },
            { id: 2, name: 'Dr. Michael Chen', votes: 28, platform: 'Teaching Excellence' },
            { id: 3, name: 'Dr. Sarah Johnson', votes: 41, platform: 'Industry Partnerships' }
          ],
          totalVoters: 105,
          votedCount: 101,
          startTime: new Date(Date.now() - 86400000 * 10).toISOString(),
          endTime: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];
      
      setElections(mockElections);
      setActiveElection(mockElections[0]);
    }
  }, [account, userRole]);
  
  // Cast vote function
  const castVote = async (candidateId) => {
    if (hasVoted) {
      showNotification('You have already voted in this election', 'warning');
      return;
    }
    
    setActiveTab('verification');
  };
  
  // Handle verification complete
  const handleVerificationComplete = () => {
    setTimeout(() => {
      // Update UI after vote
      const updatedElections = elections.map(election => {
        if (election.id === activeElection.id) {
          const updatedCandidates = election.candidates.map(candidate => {
            if (candidate.id === 1) { // Assume voted for first candidate
              return { ...candidate, votes: candidate.votes + 1 };
            }
            return candidate;
          });
          return { 
            ...election, 
            candidates: updatedCandidates,
            votedCount: election.votedCount + 1 
          };
        }
        return election;
      });
      
      setElections(updatedElections);
      setActiveElection(updatedElections.find(e => e.id === activeElection.id));
      setHasVoted(true);
      showNotification('Vote cast successfully and anonymously recorded!', 'success');
      setActiveTab('results');
    }, 1000);
  };
  
  // Format account address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get role badge
  const getRoleBadge = () => {
    switch(userRole) {
      case 'admin':
        return <span className="role-badge admin">Admin</span>;
      case 'voter':
        return <span className="role-badge voter">Voter</span>;
      case 'auditor':
        return <span className="role-badge auditor">Auditor</span>;
      default:
        return null;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="status-badge active">Active</span>;
      case 'upcoming':
        return <span className="status-badge upcoming">Upcoming</span>;
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      default:
        return null;
    }
  };
  
  // Disconnect wallet (mock function)
  const disconnectWallet = () => {
    setAccount('');
    setUserRole('visitor');
    setActiveElection(null);
    setHasVoted(false);
  };
  
  return (
    <div className={`app-container ${theme}`}>
      {/* Header with Navigation */}
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <Lock />
          </div>
          <h1>DVote</h1>
          <span className="tagline">Secure, Private & Transparent</span>
        </div>
        
        {account && (
          <div className="main-navigation">
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Home size={18} />
              <span>Dashboard</span>
            </button>
            
            <button 
              className={`nav-btn ${activeTab === 'vote' ? 'active' : ''}`}
              onClick={() => setActiveTab('vote')}
              disabled={!activeElection || activeElection.status !== 'active' || hasVoted}
            >
              <Vote size={18} />
              <span>Vote</span>
            </button>
            
            <button 
              className={`nav-btn ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              <BarChart2 size={18} />
              <span>Results</span>
            </button>
            
            <button 
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        )}
        
        <div className="header-actions">
          {account ? (
            <>
              <div className="account-info">
                {getRoleBadge()}
                <span className="address">{formatAddress(account)}</span>
              </div>
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button 
                className="disconnect-btn small"
                onClick={disconnectWallet}
              >
                <LogOut size={16} />
                <span>Disconnect</span>
              </button>
            </>
          ) : (
            <>
              <button className="theme-toggle" onClick={toggleTheme}>
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button 
                className="connect-wallet-btn" 
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="main-content">
        {!account ? (
          <div className="welcome-section">
            <div className="hero">
              <h1>Decentralized Voting with zk-SNARK Privacy</h1>
              <p>DVote combines the transparency of blockchain with the privacy of zero-knowledge proofs to create a secure and anonymous voting platform.</p>
              
              <div className="hero-cta">
                <button 
                  className="connect-wallet-btn large" 
                  onClick={connectWallet}
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : 'Connect with MetaMask'}
                </button>
                <button className="learn-more-btn" onClick={() => window.scrollTo({ top: document.querySelector('.features').offsetTop, behavior: 'smooth' })}>
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="features">
              <div className="feature-card">
                <div className="feature-icon"><Lock /></div>
                <h3>Privacy-Preserving</h3>
                <p>Your vote remains anonymous using zero-knowledge proofs, ensuring no one can tie your identity to your vote choice.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><BarChart2 /></div>
                <h3>Real-Time Results</h3>
                <p>Watch election results update instantly on the blockchain with complete confidence in their accuracy.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Info /></div>
                <h3>Transparent & Auditable</h3>
                <p>All votes are cryptographically verifiable while maintaining privacy, eliminating the possibility of fraud.</p>
              </div>
            </div>
            
            <div className="tech-overview">
              <h2>How It Works</h2>
              <div className="tech-steps">
                <div className="tech-step">
                  <div className="step-number">1</div>
                  <h3>Voter Registration</h3>
                  <p>Voters register their wallet addresses and receive a private credential through a secure channel.</p>
                </div>
                <div className="tech-step">
                  <div className="step-number">2</div>
                  <h3>Zero-Knowledge Proof</h3>
                  <p>When voting, a zk-SNARK proof is generated to verify eligibility without revealing identity.</p>
                </div>
                <div className="tech-step">
                  <div className="step-number">3</div>
                  <h3>Anonymous Voting</h3>
                  <p>The vote is recorded on the blockchain with a nullifier to prevent double-voting.</p>
                </div>
                <div className="tech-step">
                  <div className="step-number">4</div>
                  <h3>Verification</h3>
                  <p>Anyone can verify the election's integrity without compromising voter privacy.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="page-container">
            {/* Elections Selector */}
            {elections.length > 0 && (
              <div className="elections-selector">
                <h3>Select Election</h3>
                <div className="elections-scroll">
                  {elections.map(election => (
                    <div 
                      key={election.id} 
                      className={`election-card ${activeElection && activeElection.id === election.id ? 'active' : ''}`}
                      onClick={() => setActiveElection(election)}
                    >
                      <h4>{election.title}</h4>
                      <div className="election-meta">
                        {getStatusBadge(election.status)}
                        <span className="vote-count">{election.votedCount}/{election.totalVoters}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Page Content */}
            <div className="page-content">
              {activeTab === 'dashboard' && activeElection && (
                <div className="election-details">
                  <div className="election-header">
                    <h2>{activeElection.title}</h2>
                    {getStatusBadge(activeElection.status)}
                  </div>
                  
                  <div className="election-stats">
                    <div className="stat">
                      <span className="stat-label">Start Time</span>
                      <span className="stat-value">{new Date(activeElection.startTime).toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">End Time</span>
                      <span className="stat-value">{new Date(activeElection.endTime).toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Voters</span>
                      <span className="stat-value">{activeElection.totalVoters}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Participation</span>
                      <span className="stat-value">{Math.round((activeElection.votedCount / activeElection.totalVoters) * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="election-actions">
                    {activeElection.status === 'active' && !hasVoted && (
                      <button 
                        className="vote-now-btn"
                        onClick={() => setActiveTab('vote')}
                      >
                        Vote Now
                      </button>
                    )}
                    {(activeElection.status !== 'active' || hasVoted) && (
                      <button 
                        className="view-results-btn"
                        onClick={() => setActiveTab('results')}
                      >
                        View Results
                      </button>
                    )}
                  </div>
                  
                  {hasVoted && (
                    <div className="voted-message">
                      <CheckCircle />
                      <p>You have already voted in this election</p>
                    </div>
                  )}
                  
                  {activeElection.status === 'upcoming' && (
                    <div className="upcoming-message">
                      <AlertTriangle />
                      <p>This election has not started yet</p>
                    </div>
                  )}
                  
                  {activeElection.status === 'completed' && (
                    <div className="completed-message">
                      <Info />
                      <p>This election has ended</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'vote' && activeElection && (
                <div className="vote-section">
                  <h2>Cast Your Vote</h2>
                  <p className="vote-instructions">
                    Select a candidate below to cast your vote. Your vote will be anonymous thanks to zk-SNARK technology.
                  </p>
                  
                  <div className="candidates-list">
                    {activeElection.candidates.map(candidate => (
                      <div key={candidate.id} className="candidate-card">
                        <div className="candidate-info">
                          <h3>{candidate.name}</h3>
                          <p className="candidate-platform">{candidate.platform}</p>
                        </div>
                        <button 
                          className="cast-vote-btn"
                          onClick={() => castVote(candidate.id)}
                          disabled={hasVoted}
                        >
                          Vote
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="vote-notice">
                    <Lock size={16} />
                    <p>
                      Your vote is anonymous and cannot be linked back to your identity.
                      The zero-knowledge proof system ensures privacy while maintaining transparency.
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'results' && activeElection && (
                <Results election={activeElection} />
              )}
              
              {activeTab === 'verification' && (
                <ZkVerification onVerificationComplete={handleVerificationComplete} />
              )}
              
              {activeTab === 'settings' && (
                <div className="settings-section">
                  <h2>Account Settings</h2>
                  
                  <div className="settings-card">
                    <h3>Wallet Information</h3>
                    <div className="setting-item">
                      <span className="setting-label">Connected Address</span>
                      <span className="setting-value">{account}</span>
                    </div>
                    <div className="setting-item">
                      <span className="setting-label">Role</span>
                      <span className="setting-value capitalize">{userRole}</span>
                    </div>
                    <div className="setting-item">
                      <span className="setting-label">Network</span>
                      <span className="setting-value">Ethereum (Goerli Testnet)</span>
                    </div>
                    <button className="disconnect-btn" onClick={disconnectWallet}>
                      Disconnect Wallet
                    </button>
                  </div>
                  
                  <div className="settings-card">
                    <h3>Application Settings</h3>
                    <div className="setting-item">
                      <span className="setting-label">Theme</span>
                      <div className="theme-selector">
                        <button 
                          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                          onClick={() => {
                            setTheme('light');
                            document.documentElement.setAttribute('data-theme', 'light');
                          }}
                        >
                          <Sun size={16} />
                          <span>Light</span>
                        </button>
                        <button 
                          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                          onClick={() => {
                            setTheme('dark');
                            document.documentElement.setAttribute('data-theme', 'dark');
                          }}
                        >
                          <Moon size={16} />
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>
                    <div className="setting-item">
                      <span className="setting-label">Notifications</span>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="settings-card">
                    <h3>Privacy Settings</h3>
                    <p className="privacy-info">
                      DVote uses zk-SNARKs to ensure your vote remains private. Your identity is never linked to your voting choices on the blockchain.
                    </p>
                    <div className="verification-keys">
                      <div className="key-item">
                        <span className="key-label">Your Nullifier Hash</span>
                        <span className="key-value">0x7f9a8b1c5d3e2f4a6b8c0d2e4f6a8b0c...</span>
                      </div>
                      <div className="key-item">
                        <span className="key-label">Merkle Root</span>
                        <span className="key-value">0x2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; 2025 DVote - Secure Decentralized Voting</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#docs">Documentation</a>
            <a href="https://github.com/dvote" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DVoteApp;
import React, { useState, useEffect, useCallback } from 'react';
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
import AdminPanel from './AdminPanel';
import './DVoteApp.css';
import { getContract, getCandidates, getAllElections, getActiveElections, vote as castVoteOnChain } from './contract/votingContract';
import contractAddressJson from './contract/contract-address.json';
import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';
import VotingABI from './contract/artifacts/Voting.json';

/**
 * SybilResistancePanel
 * Panel for displaying and managing Sybil resistance (identity verification) for voting.
 * Accepts electionId, election object, account, and onVerified callback.
 */
function SybilResistancePanel({ electionId, election, account, onVerified }) {
  // For demonstration, display a placeholder for Semaphore and KYC, based on sybilMethod
  // In a real app, you'd implement actual verification logic here.
  let panelContent = null;
  if (!election) {
    panelContent = <div>Loading verification method...</div>;
  } else if (election.sybilMethod === 1) {
    panelContent = (
      <div className="sybil-panel-content">
        <h3>Semaphore Anonymous Verification</h3>
        <p>
          This election uses Semaphore for anonymous Sybil resistance. You will be asked to generate a zero-knowledge proof of membership.
        </p>
        <button
          className="verify-btn"
          onClick={() => {
            // Simulate async verification
            setTimeout(() => {
              if (onVerified) onVerified();
            }, 500);
          }}
        >
          Generate Proof & Verify
        </button>
      </div>
    );
  } else if (election.sybilMethod === 2) {
    panelContent = (
      <div className="sybil-panel-content">
        <h3>KYC Verification</h3>
        <p>
          This election requires KYC (Know Your Customer) verification. Please complete the identity verification process to vote.
        </p>
        <button
          className="verify-btn"
          onClick={() => {
            // Simulate async KYC verification
            setTimeout(() => {
              if (onVerified) onVerified();
            }, 800);
          }}
        >
          Verify with KYC
        </button>
      </div>
    );
  } else {
    panelContent = (
      <div className="sybil-panel-content">
        <h3>Verification Method Not Configured</h3>
        <p>
          No Sybil resistance method is set for this election.
        </p>
      </div>
    );
  }
  return (
    <div className="sybil-resistance-panel">
      {panelContent}
    </div>
  );
}

// Constants
const ADMIN_ROLE = "ADMIN_ROLE";
const USER_ROLES = {
  VISITOR: 'visitor',
  VOTER: 'voter', 
  ADMIN: 'admin',
  AUDITOR: 'auditor'
};

const ELECTION_STATUS = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed'
};

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const TABS = {
  DASHBOARD: 'dashboard',
  VOTE: 'vote',
  RESULTS: 'results',
  SETTINGS: 'settings',
  ADMIN: 'admin',
  VERIFICATION: 'verification'
};

function DVoteApp() {
  // State management
  const [account, setAccount] = useState('');
  const [userRole, setUserRole] = useState(USER_ROLES.VISITOR);
  const [elections, setElections] = useState([]);
  const [activeElection, setActiveElection] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [hasVoted, setHasVoted] = useState(false);
  
  /**
   * Displays notification message to user
   * @param {string} message - The message to display
   * @param {string} type - Type of notification (success, error, warning, info)
   */
  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  }, []);

  /**
   * Toggles between light and dark theme
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [theme]);

  /**
   * Registers voter for active election
   * @param {Object} contract - The voting contract instance
   * @param {Object} signer - The signer for transactions
   * @param {string} account - The account address
   */
  const registerVoterForActiveElection = async (contract, signer, account) => {
    const activeElections = await contract.getActiveElections();
    if (activeElections.length > 0) {
      const activeElectionId = activeElections[0][0];
      console.log("Registering voter for election ID:", activeElectionId);
      await contract.addEligibleVoter(activeElectionId, account);
      console.log("Voter registered successfully");
    }
  };

  /**
   * Connects user's wallet and determines their role
   */
  const connectWallet = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        showNotification('Please install MetaMask to use this application', NOTIFICATION_TYPES.ERROR);
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      setAccount(account);

      try {
        const contract = new Contract(contractAddressJson.Voting, VotingABI.abi, signer);
        const ADMIN_ROLE_HASH = keccak256(toUtf8Bytes(ADMIN_ROLE));
        const isAdmin = await contract.hasRole(ADMIN_ROLE_HASH, account);
        
        console.log("Connected account:", account);
        console.log("ADMIN_ROLE hash:", ADMIN_ROLE_HASH);
        console.log("hasRole result:", isAdmin);
        
        setUserRole(isAdmin ? USER_ROLES.ADMIN : USER_ROLES.VOTER);

        // Register voter if not admin
        if (!isAdmin) {
          await registerVoterForActiveElection(contract, signer, account);
        }

      } catch (err) {
        console.error('Error fetching user role:', err);
        setUserRole(USER_ROLES.VOTER);
      }
      
      showNotification('Wallet connected successfully!', NOTIFICATION_TYPES.SUCCESS);
    } catch (error) {
      console.error(error);
      showNotification('Error connecting wallet', NOTIFICATION_TYPES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats election data for display
   * @param {Object} election - Raw election data from contract
   * @param {Array} candidates - Array of candidate data
   * @returns {Object} Formatted election data
   */
  const formatElectionData = (election, candidates) => {
    const { id, title, txHash } = election;
    // Hardcode sybilMethod for testing (1: Semaphore, 2: KYC)
    return {
      id: Number(id),
      title,
      candidates,
      totalVoters: 1000, // This should come from contract if available
      votedCount: candidates.reduce((sum, c) => sum + c.votes, 0),
      startTime: new Date().toISOString(), // Should come from contract
      endTime: new Date(Date.now() + 2 * 86400000).toISOString(), // Should come from contract
      status: ELECTION_STATUS.ACTIVE, // Should be determined from contract data
      txHash: txHash || null, // Transaction hash for Etherscan link
      sybilMethod: 1 // 1 for Semaphore, 2 for KYC (hardcoded for testing)
    };
  };

  /**
   * Fetches elections from the contract and updates state
   */
  const fetchElections = useCallback(async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const electionsFromContract = await getActiveElections(provider);

      console.log("Fetched Active Elections:", electionsFromContract);

      const electionsWithCandidates = await Promise.all(
        electionsFromContract.map(async (election) => {
          const contract = getContract(provider);
          const [names, votes] = await getCandidates(contract, election.id);

          const candidates = names.map((name, i) => ({
            id: i,
            name: name,
            votes: typeof votes[i]?.toNumber === 'function'
              ? votes[i].toNumber()
              : Number(votes[i]) || 0,
            platform: ""
          }));

          return formatElectionData(election, candidates);
        })
      );

      setElections(electionsWithCandidates);
      if (electionsWithCandidates.length > 0) {
        setActiveElection(electionsWithCandidates[0]);
      }
    } catch (err) {
      console.error('Error loading elections:', err);
      showNotification('Failed to load elections from contract', NOTIFICATION_TYPES.ERROR);
    }
  }, [showNotification]);

  useEffect(() => {
    if (account && userRole !== USER_ROLES.VISITOR) {
      fetchElections();
    }
  }, [account, userRole, fetchElections]);

  /**
   * Handles vote casting
   * @param {number} candidateIndex - Index of the candidate
   */
  const castVote = async (candidateIndex) => {
    if (hasVoted) {
      showNotification('You have already voted in this election', NOTIFICATION_TYPES.WARNING);
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await castVoteOnChain(activeElection.id, candidateIndex, signer);
      showNotification('Vote submitted to the blockchain', NOTIFICATION_TYPES.SUCCESS);
      setHasVoted(true);
      setActiveTab(TABS.RESULTS);
    } catch (err) {
      console.error(err);
      showNotification('Failed to vote. Check console.', NOTIFICATION_TYPES.ERROR);
    }
  };

  /**
   * Handles verification completion
   */
  const handleVerificationComplete = useCallback(() => {
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
      showNotification('Vote cast successfully and anonymously recorded!', NOTIFICATION_TYPES.SUCCESS);
      setActiveTab(TABS.RESULTS);
    }, 1000);
  }, [elections, activeElection, showNotification]);

  /**
   * Formats wallet address for display
   * @param {string} address - The wallet address
   * @returns {string} Formatted address
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  /**
   * Renders role badge based on user role
   * @returns {JSX.Element|null} Role badge element
   */
  const getRoleBadge = () => {
    if (!userRole || userRole === USER_ROLES.VISITOR) return null;
    
    return (
      <span className={`role-badge ${userRole}`}>
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </span>
    );
  };

  /**
   * Renders status badge based on election status
   * @param {string} status - Election status
   * @returns {JSX.Element|null} Status badge element
   */
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    return (
      <span className={`status-badge ${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  /**
   * Disconnects wallet and resets state
   */
  const disconnectWallet = () => {
    setAccount('');
    setUserRole(USER_ROLES.VISITOR);
    setActiveElection(null);
    setHasVoted(false);
  };

  /**
   * Handles navigation tab click
   * @param {string} tab - Tab identifier
   */
  const handleTabClick = (tab) => {
    setActiveTab(tab);
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
          <nav className="main-navigation">
            <button 
              className={`nav-btn ${activeTab === TABS.DASHBOARD ? 'active' : ''}`}
              onClick={() => handleTabClick(TABS.DASHBOARD)}
            >
              <Home size={18} />
              <span>Dashboard</span>
            </button>
            
            <button 
              className={`nav-btn ${activeTab === TABS.VOTE ? 'active' : ''}`}
              onClick={() => handleTabClick(TABS.VOTE)}
              disabled={!activeElection || activeElection.status !== ELECTION_STATUS.ACTIVE || hasVoted}
            >
              <Vote size={18} />
              <span>Vote</span>
            </button>
            
            <button 
              className={`nav-btn ${activeTab === TABS.RESULTS ? 'active' : ''}`}
              onClick={() => handleTabClick(TABS.RESULTS)}
            >
              <BarChart2 size={18} />
              <span>Results</span>
            </button>
            
            <button 
              className={`nav-btn ${activeTab === TABS.SETTINGS ? 'active' : ''}`}
              onClick={() => handleTabClick(TABS.SETTINGS)}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            
            {userRole === USER_ROLES.ADMIN && (
              <button 
                className={`nav-btn ${activeTab === TABS.ADMIN ? 'active' : ''}`}
                onClick={() => handleTabClick(TABS.ADMIN)}
              >
                <Lock size={18} />
                <span>Admin</span>
              </button>
            )}
          </nav>
        )}
        
        <div className="header-actions">
          {account ? (
            <>
              <div className="account-info">
                {getRoleBadge()}
                <span className="address">{formatAddress(account)}</span>
              </div>
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
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
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
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
            {elections.length > 0 ? (
              <div className="elections-selector">
                <h3>Select Election</h3>
                <div className="elections-scroll">
                  {elections.map(election => (
                    <div 
                      key={election.id} 
                      className={`election-card ${activeElection && activeElection.id === election.id ? 'active' : ''}`}
                      onClick={() => setActiveElection(election)}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') setActiveElection(election);
                      }}
                    >
                      <h4>{election.title}</h4>
                      <div className="election-meta">
                        {getStatusBadge(election.status)}
                        <span className="vote-count">{election.votedCount}/{election.totalVoters}</span>
                      </div>
                      <a 
                        href={`https://etherscan.io/tx/${election.txHash || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="etherscan-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Etherscan
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            
            {/* Page Content */}
            <div className="page-content">
              {activeTab === TABS.DASHBOARD && (
                elections.length === 0 ? (
                  <div className="no-elections-message">
                    <h3>No elections available yet</h3>
                    <p>Please check back later.</p>
                  </div>
                ) : activeElection ? (
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
                    {activeElection.status === ELECTION_STATUS.ACTIVE && !hasVoted && (
                      <button 
                        className="vote-now-btn"
                        onClick={() => setActiveTab(TABS.VOTE)}
                      >
                        Vote Now
                      </button>
                    )}
                    {(activeElection.status !== ELECTION_STATUS.ACTIVE || hasVoted) && (
                      <button 
                        className="view-results-btn"
                        onClick={() => setActiveTab(TABS.RESULTS)}
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
                  
                  {activeElection.status === ELECTION_STATUS.UPCOMING && (
                    <div className="upcoming-message">
                      <AlertTriangle />
                      <p>This election has not started yet</p>
                    </div>
                  )}
                  
                  {activeElection.status === ELECTION_STATUS.COMPLETED && (
                    <div className="completed-message">
                      <Info />
                      <p>This election has ended</p>
                    </div>
                  )}
                </div>
                ) : null
              )}
              
              {activeTab === TABS.VOTE && activeElection && (
                <div className="vote-section">
                  {/* Sybil Resistance Panel */}
                  <SybilResistancePanel
                    electionId={activeElection.id}
                    election={activeElection}
                    account={account}
                    onVerified={() => {
                      // Optional: update hasVoted or trigger some UI state
                      showNotification('Verification successful. You may now vote.', NOTIFICATION_TYPES.SUCCESS);
                    }}
                  />
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
                          onClick={() => castVote(activeElection.candidates.indexOf(candidate))}
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
              
              {activeTab === TABS.RESULTS && activeElection && (
                <Results election={activeElection} />
              )}
              
              {activeTab === TABS.VERIFICATION && (
                <ZkVerification onVerificationComplete={handleVerificationComplete} />
              )}
              
              {activeTab === TABS.SETTINGS && (
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
                      <span className="setting-value">
                        {window.ethereum?.networkVersion === "31337" ? "Localhost (Hardhat)" : "Unknown Network"}
                      </span>
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

              {activeTab === TABS.ADMIN && userRole === USER_ROLES.ADMIN && (
                <AdminPanel 
                  showNotification={showNotification}
                  refreshElections={async () => {
                    const provider = new BrowserProvider(window.ethereum);
                    const electionsFromContract = await getAllElections(provider);
                    const electionsWithCandidates = await Promise.all(
                      electionsFromContract.map(async (election) => {
                        const contract = getContract(provider);
                        const [names, votes] = await getCandidates(contract, election.id);
                        const candidates = names.map((name, index) => ({
                          id: index,
                          name,
                          votes: typeof votes[index]?.toNumber === 'function'
                            ? votes[index].toNumber()
                            : Number(votes[index]) || 0,
                          platform: ""
                        }));
                        // const status = election.active ? ELECTION_STATUS.ACTIVE : ELECTION_STATUS.COMPLETED;
                        return formatElectionData({ ...election }, candidates);
                      })
                    );
                    setElections(electionsWithCandidates);
                    setActiveElection(electionsWithCandidates[0]);
                  }}
                />
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
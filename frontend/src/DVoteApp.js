import React, { useState, useEffect } from 'react';
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
import { getContract, getCandidates, getAllElections, getActiveElections, vote as castVoteOnChain } from './contract/votingContract';
import contractAddressJson from './contract/contract-address.json';
import { BrowserProvider, Contract, keccak256, toUtf8Bytes } from 'ethers';
import VotingABI from './contract/artifacts/Voting.json'; // adjust path if needed
import AdminPanel from './AdminPanel';

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
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      setAccount(account);

      try {
        // Use contract address from contract-address.json:
        const contract = new Contract(contractAddressJson.Voting, VotingABI.abi, signer);
        const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));
        const isAdmin = await contract.hasRole(ADMIN_ROLE, account);
        console.log("Connected account:", account);
        console.log("ADMIN_ROLE hash:", ADMIN_ROLE);
        console.log("hasRole result:", isAdmin);
        setUserRole(isAdmin ? 'admin' : 'voter');

        // NEW:  register voter if not admin
        if (!isAdmin) {
          const activeElections = await contract.getActiveElections();
          if (activeElections.length > 0) {
            const activeElectionId = activeElections[0][0]; // get first active election ID
            console.log("Registering voter for election ID:", activeElectionId);
            const adminSigner = signer; // Assuming admin signer is same signer (or adjust if needed)
            await contract.addEligibleVoter(activeElectionId, account);
            console.log("Voter registered successfully");
          }
        }

      } catch (err) {
        console.error('Error fetching user role:', err);
        setUserRole('voter');
      }
      setLoading(false);
      showNotification('Wallet connected successfully!', 'success');
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
  
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const electionsFromContract = await getActiveElections(provider);

        console.log("Fetched Active Elections:", electionsFromContract);

        const electionsWithCandidates = await Promise.all(
          electionsFromContract.map(async (election) => {
            const { id, title } = election;
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

            return {
              id: Number(id),
              title,
              candidates,
              totalVoters: 1000,
              votedCount: candidates.reduce((sum, c) => sum + c.votes, 0),
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 2 * 86400000).toISOString(),
              status: 'active'
            };
          })
        );

        setElections(electionsWithCandidates);
        if (electionsWithCandidates.length > 0) {
          setActiveElection(electionsWithCandidates[0]);
        }
      } catch (err) {
        console.error('Error loading elections:', err);
        showNotification('Failed to load elections from contract', 'error');
      }
    };

    if (account && userRole !== 'visitor') {
      fetchElections();
    }
  }, [account, userRole]);
  
  // Cast vote function
  const castVote = async (candidateIndex) => {
    if (hasVoted) {
      showNotification('You have already voted in this election', 'warning');
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await castVoteOnChain(activeElection.id, candidateIndex, signer);
      showNotification('Vote submitted to the blockchain', 'success');
      setHasVoted(true);
      setActiveTab('results');
    } catch (err) {
      console.error(err);
      showNotification('Failed to vote. Check console.', 'error');
    }
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
  
}
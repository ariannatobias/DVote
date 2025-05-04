import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css';
import { BrowserProvider, Contract } from 'ethers';
import VotingABI from './contract/artifacts/Voting.json';
import contractAddressJson from './contract/contract-address.json';

import { 
  Plus, 
  PlayCircle, 
  StopCircle, 
  Users, 
  Check, 
  AlertTriangle,
  BarChart2,
  Lock,
  Calendar,
  Clock,
  List,
  RefreshCw,
  UserPlus
} from 'lucide-react';

function AdminPanel({ showNotification, refreshElections }) {
  const [candidateName, setCandidateName] = useState('');
  const [electionStarted, setElectionStarted] = useState(false);
  const [electionName, setElectionName] = useState('');
  const [electionStats, setElectionStats] = useState({
    candidates: 0,
    voters: 0,
    votesCount: 0
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [candidatesList, setCandidatesList] = useState([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [showNewElectionForm, setShowNewElectionForm] = useState(false);
  const [voterAddress, setVoterAddress] = useState('');
  const [voterElectionId, setVoterElectionId] = useState('');

  // Function to get contract instance - memoized with useCallback
  const getContractInstance = useCallback(async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new Contract(contractAddressJson.Voting, VotingABI.abi, signer);
    } catch (error) {
      console.error("Error creating contract instance:", error);
      showNotification('Failed to initialize contract', 'error');
      return null;
    }
  }, [showNotification]);

  // Check if voting is active on component mount
  useEffect(() => {
    const checkVotingStatus = async () => {
      try {
        const contract = await getContractInstance();
        if (contract) {
          const [, , statuses] = await contract.getAllElections();
          const isActive = statuses.some(status => status); // true if any election is active
          setElectionStarted(isActive);

          // Try to fetch candidates
          try {
            const electionId = await contract.nextElectionId();
            const currentElectionId = Number(electionId) - 1;
            console.log("Current Election ID:", currentElectionId);

            const results = await contract.getAllVotesOfCandidates(currentElectionId);
            const candidateNames = results[0];
            const candidateVotes = results[1];

            const candidatesData = candidateNames.map((name, index) => ({
              name,
              votes: typeof candidateVotes[index]?.toNumber === 'function' ? candidateVotes[index].toNumber() : Number(candidateVotes[index])
            }));

            setCandidatesList(candidatesData);

            setElectionStats(prev => ({
              ...prev,
              candidates: candidatesData.length,
              votesCount: candidatesData.reduce((sum, candidate) => sum + candidate.votes, 0)
            }));
          } catch (e) {
            console.error("Error fetching candidates:", e);
          }
        }
      } catch (error) {
        console.error("Error checking voting status:", error);
      }
    };

    checkVotingStatus();
  }, [getContractInstance]);

  const handleStartElection = async () => {
    if (!electionName.trim()) {
      showNotification('Please enter an election name.', 'warning');
      return;
    }
    try {
      const contract = await getContractInstance();
      if (!contract) return;

      const tx = await contract.startElection(electionName, 0); // 0 = SybilResistanceMethod.None
      await tx.wait();
      showNotification('Election started successfully!', 'success');
      setElectionStarted(true);
      setElectionName('');
      setShowNewElectionForm(false);
      if (typeof refreshElections === 'function') {
        refreshElections();
      }
    } catch (error) {
      console.error(error);
      showNotification('Failed to start election.', 'error');
    }
  };

  const handleAddCandidate = async () => {
    if (!candidateName.trim()) {
      showNotification('Please enter a candidate name.', 'warning');
      return;
    }
    try {
      const contract = await getContractInstance();
      if (!contract) return;

      const electionId = await contract.nextElectionId();
      const currentElectionId = Number(electionId) - 1;
      if (currentElectionId < 0) {
        showNotification('No active election found to add candidate.', 'error');
        return;
      }

      const tx = await contract.addCandidate(currentElectionId, candidateName.trim());
      await tx.wait();
      showNotification(`Candidate '${candidateName}' added successfully!`, 'success');

      const newCandidate = {
        name: candidateName,
        votes: 0
      };

      setCandidatesList(prev => [...prev, newCandidate]);
      setCandidateName('');

      setElectionStats(prev => ({
        ...prev,
        candidates: prev.candidates + 1
      }));
      if (typeof refreshElections === 'function') {
        refreshElections();
      }
    } catch (error) {
      console.error(error);
      showNotification('Failed to add candidate.', 'error');
    }
  };

  const handleEndElection = async () => {
    try {
      const contract = await getContractInstance();
      if (!contract) return;

      const tx = await contract.endElection();
      await tx.wait();
      showNotification('Election ended successfully!', 'success');
      setElectionStarted(false);
      if (typeof refreshElections === 'function') {
        refreshElections();
      }
    } catch (error) {
      console.error(error);
      showNotification('Failed to end election.', 'error');
    }
  };

  const handleAddVoter = async () => {
    if (!voterAddress.trim() || voterElectionId === '') {
      showNotification('Please enter both Election ID and Voter Address.', 'warning');
      return;
    }
    try {
      const contract = await getContractInstance();
      if (!contract) return;

      const tx = await contract.addEligibleVoter(Number(voterElectionId), voterAddress.trim());
      await tx.wait();
      showNotification(`Voter ${voterAddress} added to election ID ${voterElectionId}!`, 'success');
      setVoterAddress('');
      setVoterElectionId('');
    } catch (error) {
      console.error(error);
      showNotification('Failed to add voter.', 'error');
    }
  };

  const formatDateForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  useEffect(() => {
    if (!startDate) {
      const now = new Date();
      setStartDate(formatDateForInput(now));

      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 7);
      setEndDate(formatDateForInput(defaultEndDate));
    }
  }, [startDate]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>
          <Lock size={22} />
          Admin Panel
          <span className={`status-badge ${electionStarted ? 'active' : 'inactive'}`}>
            {electionStarted ? (
              <>
                <Check size={16} />
                Election Active
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                No Active Election
              </>
            )}
          </span>
        </h2>
      </div>

      {(!electionStarted || showNewElectionForm) ? (
        <div className="admin-card new-election-card">
          <h3>
            <PlayCircle size={20} />
            Start a New Election
          </h3>
          <div className="new-election-form">
            <div className="input-group">
              <label htmlFor="election-name">Election Name</label>
              <input
                id="election-name"
                type="text"
                placeholder="Enter Election Name"
                value={electionName}
                onChange={(e) => setElectionName(e.target.value)}
              />
            </div>

            <div className="date-inputs">
              <div className="input-group">
                <label htmlFor="start-date">
                  <Calendar size={16} />
                  Start Date & Time
                </label>
                <input
                  id="start-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="end-date">
                  <Calendar size={16} />
                  End Date & Time
                </label>
                <input
                  id="end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleStartElection} 
              disabled={!electionName}
              className="primary-button"
            >
              <PlayCircle size={18} />
              Start Election
            </button>

            {showNewElectionForm && (
              <button 
                onClick={() => setShowNewElectionForm(false)} 
                className="secondary-button cancel-btn"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-card election-info-card">
            <h3>
              <PlayCircle size={20} />
              Election In Progress
            </h3>
            <p>An election is currently in progress.</p>

            <div className="election-timeline">
              <div className="timeline-item">
                <Calendar size={16} />
                <span>Started: {formatDateForDisplay(startDate)}</span>
              </div>
              <div className="timeline-item">
                <Clock size={16} />
                <span>Ends: {formatDateForDisplay(endDate)}</span>
              </div>
            </div>

            <div className="election-meta">
              <div className="meta-stats">
                <div className="stat-badge">
                  <Users size={16} />
                  <span>{electionStats.candidates} Candidates</span>
                </div>
                <div className="stat-badge">
                  <BarChart2 size={16} />
                  <span>{electionStats.votesCount} Votes Cast</span>
                </div>
                <button 
                  className="view-candidates-btn"
                  onClick={() => setShowCandidates(!showCandidates)}
                >
                  <List size={16} />
                  {showCandidates ? 'Hide' : 'View'} Candidates
                </button>
              </div>

              <button 
                className="new-election-btn"
                onClick={() => setShowNewElectionForm(true)}
              >
                <RefreshCw size={16} />
                Start a Different Election
              </button>
            </div>

            {showCandidates && (
              <div className="candidates-list">
                {candidatesList.length > 0 ? (
                  <ul>
                    {candidatesList.map((candidate, index) => (
                      <li key={index} className="candidate-item">
                        <span className="candidate-name">{candidate.name}</span>
                        <span className="candidate-votes">{candidate.votes} votes</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-candidates">No candidates added yet</p>
                )}
              </div>
            )}
          </div>

          <div className="admin-cards-container">
            <div className="admin-card">
              <h3>
                <Plus size={20} />
                Add Candidate
              </h3>
              <div className="input-group">
                <label htmlFor="candidate-name">Candidate Name</label>
                <input
                  id="candidate-name"
                  type="text"
                  placeholder="Enter Candidate Name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="candidate-input"
                />
              </div>
              <button 
                onClick={handleAddCandidate} 
                disabled={!candidateName}
                className="add-candidate-btn"
              >
                <Plus size={18} />
                Add Candidate
              </button>

              {candidatesList.length > 0 && (
                <div className="added-candidates">
                  <p>Added Candidates ({candidatesList.length})</p>
                  <div className="candidate-chips">
                    {candidatesList.slice(-3).map((candidate, index) => (
                      <span key={index} className="candidate-chip">
                        {candidate.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-card">
              <h3>
                <StopCircle size={20} />
                End Election
              </h3>
              <p>End the current election and finalize results. This action cannot be undone.</p>

              <div className="scheduled-end">
                <Clock size={16} />
                <span>Scheduled End: {formatDateForDisplay(endDate)}</span>
              </div>

              <button onClick={handleEndElection} className="end-election-btn">
                <StopCircle size={18} />
                End Election Now
              </button>
            </div>

            <div className="admin-card">
              <h3>
                <UserPlus size={20} />
                Add Voter to Election
              </h3>
              <div className="input-group">
                <label htmlFor="voter-election-id">Election ID</label>
                <input
                  id="voter-election-id"
                  type="number"
                  placeholder="Enter Election ID"
                  value={voterElectionId}
                  onChange={(e) => setVoterElectionId(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="voter-address">Voter Address</label>
                <input
                  id="voter-address"
                  type="text"
                  placeholder="Enter Voter Address"
                  value={voterAddress}
                  onChange={(e) => setVoterAddress(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAddVoter}
                disabled={!voterAddress || voterElectionId === ''}
                className="add-voter-btn"
              >
                <UserPlus size={18} />
                Add Voter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminPanel;

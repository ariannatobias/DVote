import React, { useState } from 'react';
import { Lock, CheckCircle, XCircle, Eye, EyeOff, RefreshCw, Shield } from 'lucide-react';

const ZkVerification = ({ onVerificationComplete }) => {
  const [verificationStep, setVerificationStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  // Steps in the zero-knowledge proof verification process
  const verificationSteps = [
    {
      title: "Generate Key Pair",
      description: "Creating public and private keys for secure verification",
      icon: <Lock />,
    },
    {
      title: "Create Zero-Knowledge Proof",
      description: "Generating proof that you're eligible to vote without revealing your identity",
      icon: <EyeOff />,
    },
    {
      title: "Verify Eligibility",
      description: "Confirming eligibility against the Merkle tree of registered voters",
      icon: <CheckCircle />,
    },
    {
      title: "Submit Anonymous Vote",
      description: "Casting your vote with complete privacy while ensuring transparency",
      icon: <Shield />,
    }
  ];
  
  // Mock data for technical details
  const technicalDetails = [
    {
      step: "ZK Circuit Compilation",
      status: "Successful",
      details: "Circuit compiled with 1,024 constraints",
      hash: "0x71e8d74f3f03a22c3e4f95e26273e69096c31a2b9dff6a8a1d8efa14eac82a45"
    },
    {
      step: "Trusted Setup",
      status: "Verified",
      details: "Multi-party computation with 7 participants",
      hash: "0x42a9e74fb12ce8c5c437c387f6d9dd2f948739d6f13e1e259c91c861e8f826b2"
    },
    {
      step: "Proof Generation",
      status: "Complete",
      details: "Groth16 proof system - 240ms generation time",
      hash: "0x9e63c6eb7cb431619ec5c80d1a0eec4fee7524e83882d93135b15b4d6d8a3603"
    },
    {
      step: "On-Chain Verification",
      status: "Confirmed",
      details: "Gas used: 342,185 - Block #14,326,002",
      hash: "0x3d7fa24d9d7a2614b4d2b53c2c27885e6b561bd367811ffe59fa1825284b8393"
    }
  ];
  
  // Simulate verification process
  const startVerification = () => {
    setLoading(true);
    setVerificationStep(0);
    setVerified(false);
    
    // Simulate step-by-step verification
    const stepInterval = setInterval(() => {
      setVerificationStep(prevStep => {
        const nextStep = prevStep + 1;
        
        if (nextStep >= verificationSteps.length) {
          clearInterval(stepInterval);
          setLoading(false);
          setVerified(true);
          if (onVerificationComplete) onVerificationComplete();
          return prevStep;
        }
        
        return nextStep;
      });
    }, 1500);
  };
  
  // Reset the verification process
  const resetVerification = () => {
    setVerificationStep(0);
    setVerified(false);
  };
  
  return (
    <div className="zk-verification-container">
      <div className="zk-header">
        <h2>zk-SNARK Privacy Verification</h2>
        <p>Vote with complete privacy while maintaining transparency</p>
      </div>
      
      <div className="zk-content">
        <div className="zk-process">
          {verificationSteps.map((step, index) => (
            <div 
              key={index}
              className={`zk-step ${index === verificationStep && loading ? 'active' : ''} ${index < verificationStep || verified ? 'completed' : ''}`}
            >
              <div className="zk-step-icon">
                {index < verificationStep || verified ? <CheckCircle /> : step.icon}
              </div>
              <div className="zk-step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {(index === verificationStep && loading) && (
                <div className="zk-loading">
                  <RefreshCw className="spin" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="zk-actions">
          {!loading && !verified && (
            <button className="verify-btn" onClick={startVerification}>
              Start Verification
            </button>
          )}
          
          {loading && (
            <div className="verification-status">
              <RefreshCw className="spin" />
              <span>Verifying... Step {verificationStep + 1} of {verificationSteps.length}</span>
            </div>
          )}
          
          {verified && (
            <div className="verification-success">
              <CheckCircle />
              <span>Verification Complete!</span>
              <button className="reset-btn" onClick={resetVerification}>
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="technical-details-toggle" onClick={() => setExpanded(!expanded)}>
        <span>{expanded ? 'Hide' : 'Show'} Technical Details</span>
        {expanded ? <EyeOff size={16} /> : <Eye size={16} />}
      </div>
      
      {expanded && (
        <div className="technical-details">
          <table className="technical-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Status</th>
                <th>Details</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {technicalDetails.map((detail, index) => (
                <tr key={index}>
                  <td>{detail.step}</td>
                  <td className={`status ${detail.status.toLowerCase()}`}>{detail.status}</td>
                  <td>{detail.details}</td>
                  <td className="hash">{detail.hash.substring(0, 10)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="zk-explanation">
            <h3>How Zero-Knowledge Proofs Work</h3>
            <p>
              zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) allow a prover to convince a verifier 
              that a statement is true without revealing any information beyond the validity of the statement itself.
            </p>
            <p>
              In our voting system, this means you can prove you're eligible to vote without revealing your identity, 
              and you can verify your vote was counted without revealing who you voted for.
            </p>
            
            <div className="zk-example">
              <h4>Example: Anonymous Verification</h4>
              <ol>
                <li><strong>Voter credentials</strong> are hashed and added to a Merkle tree</li>
                <li><strong>You generate a proof</strong> showing your credentials exist in the tree</li>
                <li><strong>The contract verifies</strong> your proof without learning your identity</li>
                <li><strong>Your vote is recorded</strong> with a unique nullifier to prevent double-voting</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZkVerification;
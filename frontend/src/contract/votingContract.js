import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from './contractMeta';
import contractABI from './artifacts/Voting.json';

const getContract = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not detected');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
};

export const getCandidates = async () => {
  const contract = await getContract();
  const candidates = await contract.getAllVotesOfCandiates();
  return candidates.map((c, index) => ({
    id: index,
    name: c.name,
    votes: c.voteCount.toNumber(),
    platform: 'TBD',
  }));
};

export const vote = async (candidateIndex) => {
  const contract = await getContract();
  const tx = await contract.vote(candidateIndex);
  await tx.wait();
};
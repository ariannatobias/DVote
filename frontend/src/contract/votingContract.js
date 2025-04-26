import { ethers } from 'ethers';
import VotingABI from '../contract/artifacts/Voting.json';
import contractAddress from '../contract/contract-address.json';

export const getContract = (signerOrProvider) => {
  return new ethers.Contract(contractAddress.Voting, VotingABI.abi, signerOrProvider);
};

export const getCandidates = async (contract, electionId) => {
  try {
    const candidates = await contract.getAllVotesOfCandidates(electionId);
    return candidates;
  } catch (error) {
    console.error('Error fetching candidates:', error);
    throw error;
  }
};

export const getAllElections = async (signerOrProvider) => {
  const contract = getContract(signerOrProvider);
  try {
    const [ids, names, statuses] = await contract.getAllElections();

    const elections = ids.map((id, index) => ({
      id: id.toNumber(),
      title: names[index],
      status: statuses[index] ? 'active' : 'completed',
    }));

    return elections;
  } catch (error) {
    console.error('Error fetching elections:', error);
    throw error;
  }
};

export const vote = async (electionId, candidateId, signer) => {
  const contract = getContract(signer);
  const tx = await contract.vote(electionId, candidateId);
  await tx.wait();
};
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * Enhancements:
 * - Prevents repeat voting even after disconnection.
 * - Tracks and allows retrieval of the candidate a voter voted for.
 * - Requires voters to be on a pre-approved eligible list to prevent Sybil attacks.
 * - Note: zk-SNARKs not yet implemented. Consider using off-chain identity verification or third-party solutions like BrightID or World ID.
 */

contract Voting is AccessControl {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    address owner;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    mapping(address => bool) public voters;
    mapping(address => bool) public eligibleVoters;
    mapping(address => uint256) public voterToCandidate;

    uint256 public votingStart;
    uint256 public votingEnd;

    constructor(string[] memory _candidateNames, uint256 _durationInMinutes) {
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                name: _candidateNames[i],
                voteCount: 0
            }));
        }
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not an admin");
        _;
    }

    function addCandidate(string memory _name) public onlyAdmin {
        candidates.push(Candidate({
                name: _name,
                voteCount: 0
        }));
    }

    function addEligibleVoter(address _voter) public onlyAdmin {
        eligibleVoters[_voter] = true;
    }

    function addEligibleVoters(address[] memory _voters) public onlyAdmin {
        for (uint256 i = 0; i < _voters.length; i++) {
            eligibleVoters[_voters[i]] = true;
        }
    }

    function vote(uint256 _candidateIndex) public {
        require(block.timestamp >= votingStart && block.timestamp < votingEnd, "Voting is not active.");
        require(!voters[msg.sender], "You have already voted.");
        require(_candidateIndex < candidates.length, "Invalid candidate index.");
        require(eligibleVoters[msg.sender], "You are not eligible to vote.");

        candidates[_candidateIndex].voteCount++;
        voters[msg.sender] = true;
        voterToCandidate[msg.sender] = _candidateIndex;
    }

    function getAllVotesOfCandiates() public view returns (Candidate[] memory){
        return candidates;
    }

    function getVotingStatus() public view returns (bool) {
        return (block.timestamp >= votingStart && block.timestamp < votingEnd);
    }

    function getRemainingTime() public view returns (uint256) {
        require(block.timestamp >= votingStart, "Voting has not started yet.");
        if (block.timestamp >= votingEnd) {
            return 0;
        }
        return votingEnd - block.timestamp;
    }

    function getVotedCandidate(address _voter) public view returns (string memory) {
        require(voters[_voter], "This address has not voted.");
        uint256 index = voterToCandidate[_voter];
        return candidates[index].name;
    }
    function startElection() public onlyAdmin {
    votingStart = block.timestamp;
    votingEnd = block.timestamp + 5 minutes;
    }
}
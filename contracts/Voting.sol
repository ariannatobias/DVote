// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Voting is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Candidate {
        string name;
        uint256 votes;
    }

    struct Election {
        string name;
        bool active;
        uint256 startTime;
        uint256 endTime;
        Candidate[] candidates;
        mapping(address => bool) eligibleVoters;
        mapping(address => bool) hasVoted;
    }

    uint256 public nextElectionId;
    mapping(uint256 => Election) public elections;
    mapping(string => bool) public usedElectionNames;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Election lifecycle
    function startElection(string memory _name) public onlyRole(ADMIN_ROLE) {
        require(!usedElectionNames[_name], "Election name already used");
        Election storage newElection = elections[nextElectionId];
        newElection.name = _name;
        newElection.active = true;
        newElection.startTime = block.timestamp;
        usedElectionNames[_name] = true;
        nextElectionId++;
    }

    function endElection(uint256 electionId) public onlyRole(ADMIN_ROLE) {
        require(elections[electionId].active, "Election not active");
        elections[electionId].active = false;
        elections[electionId].endTime = block.timestamp;
    }

    // Candidate management
    function addCandidate(uint256 electionId, string memory _name) public onlyRole(ADMIN_ROLE) {
        require(elections[electionId].active, "Election not active");
        elections[electionId].candidates.push(Candidate({name: _name, votes: 0}));
    }

    // Voter management
    function addEligibleVoter(uint256 electionId, address _voter) public onlyRole(ADMIN_ROLE) {
        elections[electionId].eligibleVoters[_voter] = true;
    }

    function vote(uint256 electionId, uint candidateIndex) public {
        Election storage election = elections[electionId];
        require(election.active, "Election is not active");
        require(election.eligibleVoters[msg.sender], "Not eligible to vote");
        require(!election.hasVoted[msg.sender], "Already voted");
        require(candidateIndex < election.candidates.length, "Invalid candidate");

        election.candidates[candidateIndex].votes++;
        election.hasVoted[msg.sender] = true;
    }

    // View functions
    function getAllVotesOfCandidates(uint256 electionId) public view returns (string[] memory, uint256[] memory) {
        Election storage election = elections[electionId];
        uint256 len = election.candidates.length;
        string[] memory names = new string[](len);
        uint256[] memory votes = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            names[i] = election.candidates[i].name;
            votes[i] = election.candidates[i].votes;
        }
        return (names, votes);
    }

    function getAllElections() public view returns (uint256[] memory, string[] memory, bool[] memory) {
        uint256[] memory ids = new uint256[](nextElectionId);
        string[] memory names = new string[](nextElectionId);
        bool[] memory statuses = new bool[](nextElectionId);

        for (uint256 i = 0; i < nextElectionId; i++) {
            ids[i] = i;
            names[i] = elections[i].name;
            statuses[i] = elections[i].active;
        }

        return (ids, names, statuses);
    }

    function votingActive() public view returns (bool) {
        if (nextElectionId == 0) return false;
        Election storage latest = elections[nextElectionId - 1];
        return latest.active;
    }

    function getActiveElections() public view returns (uint256[] memory, string[] memory) {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < nextElectionId; i++) {
            if (elections[i].active) {
                activeCount++;
            }
        }

        uint256[] memory ids = new uint256[](activeCount);
        string[] memory names = new string[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < nextElectionId; i++) {
            if (elections[i].active) {
                ids[index] = i;
                names[index] = elections[i].name;
                index++;
            }
        }

        return (ids, names);
    }
}
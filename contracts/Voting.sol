// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Voting is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Sybil resistance options
    enum SybilResistanceMethod {
        None,
        TokenGating,    // Must hold specific NFTs/tokens
        KYCVerification // Admin-verified identities
    }

    struct Candidate {
        string name;
        uint256 votes;
    }

    struct TokenRequirement {
        address tokenAddress;
        uint256 minBalance;
        bool isNFT; // true for ERC721, false for ERC20
    }

    struct Election {
        string name;
        bool active;
        uint256 startTime;
        uint256 endTime;
        Candidate[] candidates;
        mapping(address => bool) eligibleVoters;
        mapping(address => bool) hasVoted;
        SybilResistanceMethod sybilMethod;
        TokenRequirement[] tokenRequirements; // Multiple token requirements
        mapping(address => bool) kycVerified;
    }

    uint256 public nextElectionId;
    mapping(uint256 => Election) public elections;
    mapping(string => bool) public usedElectionNames;
    
    // KYC verification tracking
    address public kycProvider;
    mapping(address => uint256) public kycTimestamp; // When KYC was completed

    event VoterRegistered(uint256 indexed electionId, address indexed voter);
    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 candidateIndex);
    event ElectionCreated(uint256 indexed electionId, string name, SybilResistanceMethod method);
    event TokenRequirementAdded(uint256 indexed electionId, address tokenAddress, uint256 minBalance);

    constructor(address _kycProvider) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        kycProvider = _kycProvider;
    }

    // Create election with simplified options
    function startElection(
        string memory _name,
        SybilResistanceMethod _sybilMethod
    ) public onlyRole(ADMIN_ROLE) {
        require(!usedElectionNames[_name], "Election name already used");
        Election storage newElection = elections[nextElectionId];
        newElection.name = _name;
        newElection.active = true;
        newElection.startTime = block.timestamp;
        newElection.sybilMethod = _sybilMethod;
        usedElectionNames[_name] = true;
        
        emit ElectionCreated(nextElectionId, _name, _sybilMethod);
        nextElectionId++;
    }

    // Add token requirements for token gating
    function addTokenRequirement(
        uint256 electionId,
        address tokenAddress,
        uint256 minBalance,
        bool isNFT
    ) public onlyRole(ADMIN_ROLE) {
        Election storage election = elections[electionId];
        require(election.sybilMethod == SybilResistanceMethod.TokenGating, "Wrong sybil method");
        
        election.tokenRequirements.push(TokenRequirement({
            tokenAddress: tokenAddress,
            minBalance: minBalance,
            isNFT: isNFT
        }));
        
        emit TokenRequirementAdded(electionId, tokenAddress, minBalance);
    }

    // Check if voter meets token requirements
    function checkTokenRequirements(uint256 electionId, address voter) public view returns (bool) {
        Election storage election = elections[electionId];
        
        if (election.sybilMethod != SybilResistanceMethod.TokenGating) return true;
        if (election.tokenRequirements.length == 0) return true;
        
        // Must meet at least one token requirement
        for (uint i = 0; i < election.tokenRequirements.length; i++) {
            TokenRequirement storage req = election.tokenRequirements[i];
            
            if (req.isNFT) {
                IERC721 nft = IERC721(req.tokenAddress);
                if (nft.balanceOf(voter) >= req.minBalance) return true;
            } else {
                IERC20 token = IERC20(req.tokenAddress);
                if (token.balanceOf(voter) >= req.minBalance) return true;
            }
        }
        
        return false;
    }

    // KYC verification by admin
    function verifyKYC(uint256 electionId, address voter) public onlyRole(VERIFIER_ROLE) {
        Election storage election = elections[electionId];
        require(election.active, "Election not active");
        require(election.sybilMethod == SybilResistanceMethod.KYCVerification, "KYC not enabled");
        
        election.kycVerified[voter] = true;
        election.eligibleVoters[voter] = true;
        kycTimestamp[voter] = block.timestamp;
        
        emit VoterRegistered(electionId, voter);
    }

    // Batch KYC verification for efficiency
    function batchVerifyKYC(uint256 electionId, address[] calldata voters) public onlyRole(VERIFIER_ROLE) {
        Election storage election = elections[electionId];
        require(election.active, "Election not active");
        require(election.sybilMethod == SybilResistanceMethod.KYCVerification, "KYC not enabled");
        
        for (uint i = 0; i < voters.length; i++) {
            election.kycVerified[voters[i]] = true;
            election.eligibleVoters[voters[i]] = true;
            kycTimestamp[voters[i]] = block.timestamp;
            emit VoterRegistered(electionId, voters[i]);
        }
    }

    // Check overall voter eligibility
    function checkVoterEligibility(uint256 electionId, address voter) public view returns (bool) {
        Election storage election = elections[electionId];
        
        if (election.sybilMethod == SybilResistanceMethod.None) {
            return election.eligibleVoters[voter];
        }
        
        if (election.sybilMethod == SybilResistanceMethod.TokenGating) {
            return checkTokenRequirements(electionId, voter);
        }
        
        if (election.sybilMethod == SybilResistanceMethod.KYCVerification) {
            return election.kycVerified[voter];
        }
        
        return false;
    }

    // Enhanced voting with sybil resistance
    function vote(uint256 electionId, uint candidateIndex) public nonReentrant {
        Election storage election = elections[electionId];
        require(election.active, "Election is not active");
        require(!election.hasVoted[msg.sender], "Already voted");
        require(candidateIndex < election.candidates.length, "Invalid candidate");
        
        // Check eligibility based on sybil resistance method
        require(checkVoterEligibility(electionId, msg.sender), "Not eligible to vote");

        election.candidates[candidateIndex].votes++;
        election.hasVoted[msg.sender] = true;
        
        emit VoteCast(electionId, msg.sender, candidateIndex);
    }

    // Existing functions...
    function endElection(uint256 electionId) public onlyRole(ADMIN_ROLE) {
        require(elections[electionId].active, "Election not active");
        elections[electionId].active = false;
        elections[electionId].endTime = block.timestamp;
    }

    function addCandidate(uint256 electionId, string memory _name) public onlyRole(ADMIN_ROLE) {
        require(elections[electionId].active, "Election not active");
        elections[electionId].candidates.push(Candidate({name: _name, votes: 0}));
    }

    function addEligibleVoter(uint256 electionId, address _voter) public onlyRole(ADMIN_ROLE) {
        elections[electionId].eligibleVoters[_voter] = true;
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

    function getTokenRequirements(uint256 electionId) public view returns (address[] memory, uint256[] memory, bool[] memory) {
        Election storage election = elections[electionId];
        uint256 len = election.tokenRequirements.length;
        
        address[] memory tokens = new address[](len);
        uint256[] memory balances = new uint256[](len);
        bool[] memory isNFTs = new bool[](len);
        
        for (uint256 i = 0; i < len; i++) {
            tokens[i] = election.tokenRequirements[i].tokenAddress;
            balances[i] = election.tokenRequirements[i].minBalance;
            isNFTs[i] = election.tokenRequirements[i].isNFT;
        }
        
        return (tokens, balances, isNFTs);
    }

    function getElectionDetails(uint256 electionId) public view returns (
        string memory name,
        bool active,
        uint256 startTime,
        uint256 endTime,
        SybilResistanceMethod sybilMethod,
        uint256 candidateCount
    ) {
        Election storage election = elections[electionId];
        return (
            election.name,
            election.active,
            election.startTime,
            election.endTime,
            election.sybilMethod,
            election.candidates.length
        );
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
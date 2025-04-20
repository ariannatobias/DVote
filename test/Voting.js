const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let Voting, voting, owner, voter1, voter2, voter3;
  const candidates = ["Alice", "Bob", "Charlie"];
  const duration = 10; // voting duration in minutes

  beforeEach(async () => {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(candidates, duration);
    await voting.waitForDeployment(); // Ensures compatibility with Ethers v6+
  });

  it("should initialize with correct candidates", async function () {
    const candidate0 = await voting.candidates(0);
    expect(candidate0.name).to.equal("Alice");
    expect(candidate0.voteCount).to.equal(0);
  });

  it("should allow only the owner to add eligible voters", async function () {
    await voting.addEligibleVoter(voter1.address);
    const isEligible = await voting.eligibleVoters(voter1.address);
    expect(isEligible).to.be.true;

    await expect(
      voting.connect(voter1).addEligibleVoter(voter2.address)
    ).to.be.reverted;
  });

  it("should allow eligible voter to vote and record vote", async function () {
    await voting.addEligibleVoter(voter1.address);
    await voting.connect(voter1).vote(1);

    const voted = await voting.voters(voter1.address);
    const candidate = await voting.candidates(1);
    const votedName = await voting.getVotedCandidate(voter1.address);

    expect(voted).to.be.true;
    expect(candidate.voteCount).to.equal(1);
    expect(votedName).to.equal("Bob");
  });

  it("should not allow voting more than once", async function () {
    await voting.addEligibleVoter(voter1.address);
    await voting.connect(voter1).vote(1);
    await expect(voting.connect(voter1).vote(2)).to.be.revertedWith("You have already voted.");
  });

  it("should not allow voting with invalid candidate index", async function () {
    await voting.addEligibleVoter(voter1.address);
    await expect(voting.connect(voter1).vote(5)).to.be.revertedWith("Invalid candidate index.");
  });

  it("should not allow ineligible voters to vote", async function () {
    await expect(voting.connect(voter1).vote(1)).to.be.revertedWith("You are not eligible to vote.");
  });

  it("should return voting status correctly", async function () {
    const status = await voting.getVotingStatus();
    expect(status).to.be.true;
  });

  it("should return remaining time correctly", async function () {
    const remaining = await voting.getRemainingTime();
    expect(remaining).to.be.gt(0);
  });

  it("should revert when retrieving voted candidate for a non-voter", async function () {
    await expect(voting.getVotedCandidate(voter1.address)).to.be.revertedWith("This address has not voted.");
  });
});
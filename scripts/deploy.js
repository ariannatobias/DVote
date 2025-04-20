const hre = require("hardhat");

async function main() {
  const Voting = await hre.ethers.getContractFactory("Voting");

  const candidateNames = ["Alice", "Bob", "Charlie"];
  const durationInMinutes = 10;

  const voting = await Voting.deploy(candidateNames, durationInMinutes);
  console.log(`Voting contract deployed to: ${voting.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

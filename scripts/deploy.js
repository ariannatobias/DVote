const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Voting = await ethers.getContractFactory("Voting");

  const voting = await Voting.deploy();

  console.log("Voting contract deployed to:", voting.target); // ethers v6 uses .target

  // Save the deployed address to frontend
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contract");

  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendContractsDir, "contract-address.json"),
    JSON.stringify({ Voting: voting.target }, null, 2)
  );

  console.log("Contract address saved to frontend/src/contract/contract-address.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
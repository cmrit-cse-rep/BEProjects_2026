const hre = require("hardhat");

async function main() {
  const Sentinel = await hre.ethers.getContractFactory("SentinelChain");
  const sentinel = await Sentinel.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  const description = await sentinel.getLatestDescription();

  console.log("Current Threat:");
  console.log("Description:", description);

  const tx = await sentinel.reportThreat("New threat detected!");
  await tx.wait();

  const updatedDescription = await sentinel.getLatestDescription();

  console.log("Updated Threat:");
  console.log("Description:", updatedDescription);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

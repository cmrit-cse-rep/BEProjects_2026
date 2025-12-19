const hre = require("hardhat");

async function main() {
  const SentinelChain = await hre.ethers.getContractFactory("SentinelChain");
  const sentinel = await SentinelChain.deploy();
  await sentinel.waitForDeployment();
  console.log(`SentinelChain deployed to: ${await sentinel.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

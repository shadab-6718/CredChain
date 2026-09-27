import { ethers, network } from "hardhat";

async function main() {
  console.log("==========================================");
  console.log("CredChain Smart Contract Deployment");
  console.log(`Target Network: ${network.name} (Chain ID: ${network.config.chainId})`);
  console.log("==========================================");

  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error(
      "❌ Deployment failed: No deployer account found. Check your DEPLOYER_PRIVATE_KEY environment variable."
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Address : ${deployer.address}`);
  console.log(`Account Balance  : ${ethers.formatEther(balance)} POL/ETH`);

  if (network.name === "amoy" && balance === 0n) {
    console.warn("⚠️ Warning: Deployer balance is 0. You need test POL from Polygon Amoy Faucet to deploy.");
  }

  console.log("\nDeploying CredChain contract...");
  const CredChainFactory = await ethers.getContractFactory("CredChain");
  const credChain = await CredChainFactory.deploy();
  await credChain.waitForDeployment();

  const contractAddress = await credChain.getAddress();
  const deployTx = credChain.deploymentTransaction();

  console.log("\n✅ CredChain Contract Deployed Successfully!");
  console.log("------------------------------------------");
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Transaction Hash : ${deployTx ? deployTx.hash : "N/A"}`);
  console.log(`Network          : ${network.name}`);
  console.log(`Chain ID         : ${network.config.chainId}`);
  console.log("------------------------------------------");

  if (network.name === "amoy") {
    console.log(`Explorer Link    : https://amoy.polygonscan.com/address/${contractAddress}`);
  }

  console.log("\n📌 Next Step: Update CREDCHAIN_CONTRACT_ADDRESS in your root .env file:");
  console.log(`CREDCHAIN_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_CREDCHAIN_CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error("❌ Deployment error:", error);
  process.exitCode = 1;
});

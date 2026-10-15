
import { network } from "hardhat";
import { readFileSync, writeFileSync } from "node:fs";

const deploymentFile = new URL("../deployments-sepolia.json", import.meta.url);

const deployments = JSON.parse(
  readFileSync(deploymentFile, "utf8")
);

if (deployments.mockProtocol) {
  throw new Error("MockProtocol is already deployed");
}

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("Network: Ethereum Sepolia");
console.log("Deployer:", deployer.address);
console.log("Deploying MockProtocol...");

const mock = await ethers.deployContract("MockProtocol");

const tx = mock.deploymentTransaction();

console.log("Deployment transaction:", tx?.hash);

await mock.waitForDeployment();

const mockAddress = await mock.getAddress();

deployments.mockProtocol = mockAddress;
deployments.mockProtocolDeployTx = tx?.hash;

writeFileSync(
  deploymentFile,
  JSON.stringify(deployments, null, 2) + "\n"
);

console.log("MockProtocol deployed:", mockAddress);
console.log("Deployment data saved successfully");

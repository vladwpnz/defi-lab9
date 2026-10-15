
import { network } from "hardhat";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const outputPath = new URL("../deployments-sepolia.json", import.meta.url);

if (existsSync(outputPath)) {
  throw new Error("Deployment file already exists. Check before redeploying.");
}

const previousDeployments = JSON.parse(
  readFileSync(
    new URL("../../defi-lab7/deployments-sepolia.json", import.meta.url),
    "utf8"
  )
);

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

console.log("Deployer:", deployer.address);
console.log("Governance token:", previousDeployments.vlc);
console.log("Deploying SimpleDAO...");

const dao = await ethers.deployContract("SimpleDAO", [
  previousDeployments.vlc
]);

await dao.waitForDeployment();

const daoAddress = await dao.getAddress();
const governanceToken = await dao.governanceToken();

const deployment = {
  network: "sepolia",
  vlc: governanceToken,
  dao: daoAddress,
  daoDeployTx: dao.deploymentTransaction()?.hash
};

writeFileSync(outputPath, JSON.stringify(deployment, null, 2));

console.log("SimpleDAO deployed:", daoAddress);
console.log("Deployment transaction:", deployment.daoDeployTx);
console.log("Governance token verified:", governanceToken);
console.log("Deployment saved to deployments-sepolia.json");

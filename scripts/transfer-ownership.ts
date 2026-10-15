
import { network } from "hardhat";
import { readFileSync, writeFileSync } from "node:fs";

const deploymentFile = new URL(
  "../deployments-sepolia.json",
  import.meta.url
);

const deployments = JSON.parse(
  readFileSync(deploymentFile, "utf8")
);

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

const mock = await ethers.getContractAt(
  "MockProtocol",
  deployments.mockProtocol
);

const currentOwner = await mock.owner();

console.log("MockProtocol:", deployments.mockProtocol);
console.log("Current owner:", currentOwner);
console.log("DAO address:", deployments.dao);

if (currentOwner.toLowerCase() === deployments.dao.toLowerCase()) {
  throw new Error("Ownership already transferred to DAO");
}

if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
  throw new Error("Deployer is not the current owner");
}

const daoCode = await ethers.provider.getCode(deployments.dao);

if (daoCode === "0x") {
  throw new Error("DAO contract not found");
}

console.log("Transferring ownership to DAO...");

const tx = await mock.transferOwnership(deployments.dao);

console.log("Transaction hash:", tx.hash);

const receipt = await tx.wait();

if (!receipt || receipt.status !== 1) {
  throw new Error("Ownership transfer transaction failed");
}

const newOwner = await mock.owner();

console.log("New owner:", newOwner);

if (newOwner.toLowerCase() !== deployments.dao.toLowerCase()) {
  throw new Error("Ownership verification failed");
}

deployments.ownershipTransferTx = tx.hash;

writeFileSync(
  deploymentFile,
  JSON.stringify(deployments, null, 2) + "\n"
);

console.log("Ownership transfer: SUCCESS");

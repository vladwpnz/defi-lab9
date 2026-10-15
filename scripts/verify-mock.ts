
import { network } from "hardhat";
import { readFileSync } from "node:fs";

const deployments = JSON.parse(
  readFileSync(
    new URL("../deployments-sepolia.json", import.meta.url),
    "utf8"
  )
);

const { ethers } = await network.create();
const [deployer] = await ethers.getSigners();

const mock = await ethers.getContractAt(
  "MockProtocol",
  deployments.mockProtocol
);

const code = await ethers.provider.getCode(deployments.mockProtocol);
const owner = await mock.owner();
const fee = await mock.fee();

console.log("MockProtocol:", deployments.mockProtocol);
console.log("Current owner:", owner);
console.log("Expected owner:", deployer.address);
console.log("Initial fee:", fee.toString());

if (code === "0x") {
  throw new Error("Contract bytecode not found");
}

if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
  throw new Error("Unexpected contract owner");
}

if (fee !== 3n) {
  throw new Error("Unexpected initial fee");
}

console.log("MockProtocol verification: SUCCESS");

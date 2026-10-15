
import { network } from "hardhat";

const daoAddress = "0x047b78080d2ddde72fdc9ebd77aa86848b53b7fb";
const expectedToken = "0xa001C70C1A8F4a8F524f45B2C7a53Dc8F03f00b8";

const { ethers } = await network.create();

const code = await ethers.provider.getCode(daoAddress);

if (code === "0x") {
  throw new Error("No contract bytecode found at DAO address");
}

const dao = await ethers.getContractAt("SimpleDAO", daoAddress);
const governanceToken = await dao.governanceToken();
const proposalCount = await dao.proposalCount();

if (governanceToken.toLowerCase() !== expectedToken.toLowerCase()) {
  throw new Error("Unexpected governance token");
}

console.log("DAO address:", daoAddress);
console.log("Contract bytecode: verified");
console.log("Governance token:", governanceToken);
console.log("Proposal count:", proposalCount.toString());
console.log("DAO verification: SUCCESS");

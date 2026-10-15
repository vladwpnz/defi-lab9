
import { network } from "hardhat";
import { readFileSync, writeFileSync } from "node:fs";

const deploymentFile = new URL(
  "../deployments-sepolia.json",
  import.meta.url
);

const deployments = JSON.parse(
  readFileSync(deploymentFile, "utf8")
);

if (deployments.proposalId === undefined) {
  throw new Error("Proposal ID not found");
}

if (deployments.proposalExecuteTx) {
  throw new Error("Execution transaction already recorded");
}

const { ethers } = await network.create();
const [executor] = await ethers.getSigners();

const dao = await ethers.getContractAt(
  "SimpleDAO",
  deployments.dao
);

const mock = await ethers.getContractAt(
  "MockProtocol",
  deployments.mockProtocol
);

const proposalId = BigInt(deployments.proposalId);
const proposal = await dao.proposals(proposalId);
const currentFee = await mock.fee();
const owner = await mock.owner();

console.log("Executor:", executor.address);
console.log("DAO:", deployments.dao);
console.log("MockProtocol:", deployments.mockProtocol);
console.log("Proposal ID:", proposalId.toString());
console.log("Current fee:", currentFee.toString());
console.log("YES votes:", proposal.yesVotes.toString());
console.log("NO votes:", proposal.noVotes.toString());

if (owner.toLowerCase() !== deployments.dao.toLowerCase()) {
  throw new Error("DAO is not the protocol owner");
}

if (
  proposal.targetContract.toLowerCase() !==
  deployments.mockProtocol.toLowerCase()
) {
  throw new Error("Unexpected proposal target");
}

const expectedPayload = mock.interface.encodeFunctionData(
  "setFee",
  [10n]
);

if (proposal.payload !== expectedPayload) {
  throw new Error("Unexpected proposal payload");
}

if (proposal.executed) {
  throw new Error("Proposal already executed");
}

if (proposal.yesVotes <= proposal.noVotes) {
  throw new Error("Proposal not approved");
}

const latestBlock = await ethers.provider.getBlock("latest");

if (!latestBlock) {
  throw new Error("Could not retrieve latest block");
}

if (BigInt(latestBlock.timestamp) < proposal.deadline) {
  throw new Error("Voting period has not ended yet");
}

console.log("Voting period: completed");
console.log("Proposal approved: YES");
console.log("Executing proposal...");

const tx = await dao.executeProposal(proposalId);

console.log("Execution transaction:", tx.hash);

deployments.proposalExecuteTx = tx.hash;

writeFileSync(
  deploymentFile,
  JSON.stringify(deployments, null, 2) + "\n"
);

const receipt = await tx.wait();

if (!receipt || receipt.status !== 1) {
  throw new Error("Proposal execution failed");
}

const updatedFee = await mock.fee();
const updatedProposal = await dao.proposals(proposalId);

console.log("Previous fee:", currentFee.toString());
console.log("Updated fee:", updatedFee.toString());
console.log("Proposal executed:", updatedProposal.executed);

if (updatedFee !== 10n || !updatedProposal.executed) {
  throw new Error("Final verification failed");
}

deployments.proposalExecutionVerified = true;

writeFileSync(
  deploymentFile,
  JSON.stringify(deployments, null, 2) + "\n"
);

console.log("DAO execution: SUCCESS");
console.log("MockProtocol fee updated to 10");

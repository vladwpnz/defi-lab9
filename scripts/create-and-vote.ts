
import { network } from "hardhat";
import { readFileSync, writeFileSync } from "node:fs";

const deploymentFile = new URL(
  "../deployments-sepolia.json",
  import.meta.url
);

const deployments = JSON.parse(
  readFileSync(deploymentFile, "utf8")
);

if (deployments.proposalId !== undefined) {
  throw new Error("Proposal already exists in deployment file");
}

const { ethers } = await network.create();
const [voter] = await ethers.getSigners();

const dao = await ethers.getContractAt(
  "SimpleDAO",
  deployments.dao
);

const mock = await ethers.getContractAt(
  "MockProtocol",
  deployments.mockProtocol
);

const token = new ethers.Contract(
  deployments.vlc,
  ["function balanceOf(address) view returns (uint256)"],
  ethers.provider
);

const owner = await mock.owner();
const currentFee = await mock.fee();
const votingPower = await token.balanceOf(voter.address);

if (owner.toLowerCase() !== deployments.dao.toLowerCase()) {
  throw new Error("DAO is not the owner of MockProtocol");
}

if (currentFee !== 3n) {
  throw new Error("Unexpected initial fee");
}

if (votingPower === 0n) {
  throw new Error("Wallet has no governance tokens");
}

const payload = mock.interface.encodeFunctionData(
  "setFee",
  [10n]
);

console.log("Network: Ethereum Sepolia");
console.log("Voter:", voter.address);
console.log("DAO:", deployments.dao);
console.log("MockProtocol:", deployments.mockProtocol);
console.log("Current fee:", currentFee.toString());
console.log("Target fee: 10");
console.log("Voting power:", votingPower.toString());
console.log("Encoded payload:", payload);

console.log("Creating DAO proposal...");

const createTx = await dao.createProposal(
  deployments.mockProtocol,
  payload,
  "Change MockProtocol fee from 3 to 10"
);

console.log("Creation transaction:", createTx.hash);

const createReceipt = await createTx.wait();

if (!createReceipt || createReceipt.status !== 1) {
  throw new Error("Proposal creation failed");
}

let proposalId: bigint | null = null;

for (const log of createReceipt.logs) {
  try {
    const parsed = dao.interface.parseLog(log);

    if (parsed?.name === "ProposalCreated") {
      proposalId = BigInt(parsed.args[0]);
      break;
    }
  } catch {
    continue;
  }
}

if (proposalId === null) {
  throw new Error("ProposalCreated event not found");
}

console.log("Proposal created, ID:", proposalId.toString());

deployments.proposalId = proposalId.toString();
deployments.proposalCreateTx = createTx.hash;

writeFileSync(
  deploymentFile,
  JSON.stringify(deployments, null, 2) + "\n"
);

console.log("Proposal creation: SUCCESS");
console.log("Voting YES...");

const voteTx = await dao.vote(proposalId, true);

console.log("Voting transaction:", voteTx.hash);

const voteReceipt = await voteTx.wait();

if (!voteReceipt || voteReceipt.status !== 1) {
  throw new Error("Voting transaction failed");
}

deployments.proposalVoteTx = voteTx.hash;

writeFileSync(
  deploymentFile,
  JSON.stringify(deployments, null, 2) + "\n"
);

const proposal = await dao.proposals(proposalId);
const hasVoted = await dao.hasVoted(
  proposalId,
  voter.address
);

console.log("YES votes:", proposal.yesVotes.toString());
console.log("NO votes:", proposal.noVotes.toString());
console.log("Voter registered:", hasVoted);

if (!hasVoted || proposal.yesVotes === 0n) {
  throw new Error("Vote verification failed");
}

console.log("Proposal creation: SUCCESS");
console.log("Governance voting: SUCCESS");
console.log("Proposal ID:", proposalId.toString());
console.log("Ready for proposal execution");

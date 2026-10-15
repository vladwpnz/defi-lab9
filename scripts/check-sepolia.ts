
import hre from "hardhat";
import { readFileSync } from "node:fs";

const { ethers } = await hre.network.connect();
const [account] = await ethers.getSigners();

const network = await ethers.provider.getNetwork();
const ethBalance = await ethers.provider.getBalance(account.address);

const deployments = JSON.parse(
  readFileSync(
    new URL("../../defi-lab7/deployments-sepolia.json", import.meta.url),
    "utf8"
  )
);

const token = new ethers.Contract(
  deployments.vlc,
  [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ],
  ethers.provider
);

const tokenBalance = await token.balanceOf(account.address);
const decimals = await token.decimals();
const symbol = await token.symbol();

console.log("Network chain ID:", network.chainId.toString());
console.log("Wallet:", account.address);
console.log("ETH balance:", ethers.formatEther(ethBalance));
console.log("Governance token:", deployments.vlc);
console.log("Token symbol:", symbol);
console.log("Token balance:", ethers.formatUnits(tokenBalance, decimals));

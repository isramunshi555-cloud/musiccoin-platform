import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log("Deploying MusicCoin Contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "POL / ETH");
  console.log("==================================================");

  // 1. Deploy FanToken
  console.log("\n1. Deploying FanToken (MUSIC)...");
  const initialSupply = ethers.parseEther("10000000"); // 10 Million initial supply
  const FanTokenFactory = await ethers.getContractFactory("FanToken");
  const fanToken = await FanTokenFactory.deploy(
    "MusicCoin",
    "MUSIC",
    initialSupply,
    deployer.address
  );
  await fanToken.waitForDeployment();
  const fanTokenAddress = await fanToken.getAddress();
  console.log("-> FanToken deployed at:", fanTokenAddress);

  // 2. Deploy ArtistIdentity
  console.log("\n2. Deploying ArtistIdentity (DID / SBT)...");
  const ArtistIdentityFactory = await ethers.getContractFactory("ArtistIdentity");
  const artistIdentity = await ArtistIdentityFactory.deploy(deployer.address);
  await artistIdentity.waitForDeployment();
  const artistIdentityAddress = await artistIdentity.getAddress();
  console.log("-> ArtistIdentity deployed at:", artistIdentityAddress);

  // 3. Deploy MusicNFT
  console.log("\n3. Deploying MusicNFT (ERC-721 + ERC-2981)...");
  const MusicNFTFactory = await ethers.getContractFactory("MusicNFT");
  const musicNFT = await MusicNFTFactory.deploy(deployer.address);
  await musicNFT.waitForDeployment();
  const musicNFTAddress = await musicNFT.getAddress();
  console.log("-> MusicNFT deployed at:", musicNFTAddress);

  // 4. Deploy EventTicket
  console.log("\n4. Deploying EventTicket (Anti-Scalp NFT)...");
  const EventTicketFactory = await ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicketFactory.deploy(deployer.address);
  await eventTicket.waitForDeployment();
  const eventTicketAddress = await eventTicket.getAddress();
  console.log("-> EventTicket deployed at:", eventTicketAddress);

  // 5. Deploy RoyaltyDistribution
  console.log("\n5. Deploying RoyaltyDistribution (Auto Revenue Splitter)...");
  const RoyaltyDistFactory = await ethers.getContractFactory("RoyaltyDistribution");
  const royaltyDist = await RoyaltyDistFactory.deploy(deployer.address);
  await royaltyDist.waitForDeployment();
  const royaltyDistAddress = await royaltyDist.getAddress();
  console.log("-> RoyaltyDistribution deployed at:", royaltyDistAddress);

  // Authorize deployer as minters/gatekeepers across contracts
  console.log("\n6. Configuring default minters & gatekeepers...");
  await (await fanToken.setMinter(deployer.address, true)).wait();
  await (await musicNFT.setMinter(deployer.address, true)).wait();
  await (await eventTicket.setGateKeeper(deployer.address, true)).wait();
  console.log("-> Default roles configured.");

  // Save deployment artifact JSON
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      FanToken: fanTokenAddress,
      ArtistIdentity: artistIdentityAddress,
      MusicNFT: musicNFTAddress,
      EventTicket: eventTicketAddress,
      RoyaltyDistribution: royaltyDistAddress,
    },
  };

  const outputPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment manifest saved to ${outputPath}`);
  console.log("==================================================");
  console.log("Deployment completed successfully!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

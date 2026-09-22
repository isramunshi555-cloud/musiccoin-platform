import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  FanToken,
  ArtistIdentity,
  MusicNFT,
  EventTicket,
  RoyaltyDistribution,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MusicCoin Platform Smart Contract Suite", function () {
  let owner: SignerWithAddress;
  let artist: SignerWithAddress;
  let fan1: SignerWithAddress;
  let fan2: SignerWithAddress;
  let organizer: SignerWithAddress;
  let producer: SignerWithAddress;
  let gateKeeper: SignerWithAddress;

  let fanToken: FanToken;
  let artistIdentity: ArtistIdentity;
  let musicNFT: MusicNFT;
  let eventTicket: EventTicket;
  let royaltyDist: RoyaltyDistribution;

  beforeEach(async function () {
    [owner, artist, fan1, fan2, organizer, producer, gateKeeper] = await ethers.getSigners();

    // 1. Deploy FanToken
    const FanTokenFactory = await ethers.getContractFactory("FanToken");
    fanToken = (await FanTokenFactory.deploy(
      "MusicCoin",
      "MUSIC",
      ethers.parseEther("1000000"), // 1M supply
      owner.address
    )) as FanToken;
    await fanToken.waitForDeployment();

    // 2. Deploy ArtistIdentity
    const ArtistIdentityFactory = await ethers.getContractFactory("ArtistIdentity");
    artistIdentity = (await ArtistIdentityFactory.deploy(owner.address)) as ArtistIdentity;
    await artistIdentity.waitForDeployment();

    // 3. Deploy MusicNFT
    const MusicNFTFactory = await ethers.getContractFactory("MusicNFT");
    musicNFT = (await MusicNFTFactory.deploy(owner.address)) as MusicNFT;
    await musicNFT.waitForDeployment();

    // 4. Deploy EventTicket
    const EventTicketFactory = await ethers.getContractFactory("EventTicket");
    eventTicket = (await EventTicketFactory.deploy(owner.address)) as EventTicket;
    await eventTicket.waitForDeployment();
    await eventTicket.setGateKeeper(gateKeeper.address, true);

    // 5. Deploy RoyaltyDistribution
    const RoyaltyDistFactory = await ethers.getContractFactory("RoyaltyDistribution");
    royaltyDist = (await RoyaltyDistFactory.deploy(owner.address)) as RoyaltyDistribution;
    await royaltyDist.waitForDeployment();
  });

  describe("1. FanToken (ERC-20, Votes & Staking)", function () {
    it("Should deploy with correct name, symbol, and initial supply", async function () {
      expect(await fanToken.name()).to.equal("MusicCoin");
      expect(await fanToken.symbol()).to.equal("MUSIC");
      expect(await fanToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000"));
    });

    it("Should allow staking for 30 days and reward calculation", async function () {
      // Transfer tokens to fan1
      const stakeAmount = ethers.parseEther("1000");
      await fanToken.transfer(fan1.address, stakeAmount);
      expect(await fanToken.balanceOf(fan1.address)).to.equal(stakeAmount);

      // Fan1 stakes 1000 tokens for 30 days
      const thirtyDays = 30 * 24 * 60 * 60;
      await fanToken.connect(fan1).stake(stakeAmount, thirtyDays);

      expect(await fanToken.balanceOf(fan1.address)).to.equal(0n);
      expect(await fanToken.totalStaked()).to.equal(stakeAmount);

      // Fast-forward 30 days in time
      await time.increase(thirtyDays + 1);

      // Check reward > 0
      const reward = await fanToken.calculateReward(fan1.address, 0);
      expect(reward).to.be.gt(0n);

      // Unstake
      await fanToken.connect(fan1).unstake(0);
      const finalBalance = await fanToken.balanceOf(fan1.address);
      expect(finalBalance).to.be.gte(stakeAmount);
    });

    it("Should revert unstake before lock duration expires", async function () {
      const stakeAmount = ethers.parseEther("500");
      await fanToken.transfer(fan1.address, stakeAmount);
      const ninetyDays = 90 * 24 * 60 * 60;
      await fanToken.connect(fan1).stake(stakeAmount, ninetyDays);

      // Try unstaking immediately
      await expect(fanToken.connect(fan1).unstake(0)).to.be.revertedWithCustomError(
        fanToken,
        "LockPeriodNotEnded"
      );
    });
  });

  describe("2. ArtistIdentity (Soulbound DID Badge)", function () {
    it("Should allow an artist to apply and receive verification", async function () {
      // Apply
      await artistIdentity.connect(artist).applyForVerification("DJ Cyberpunk", "ipfs://artist-profile-hash");

      // Admin/Verifier approves
      await artistIdentity.verifyArtist(
        artist.address,
        "DJ Cyberpunk",
        "ipfs://artist-profile-hash",
        100 // initial score
      );

      expect(await artistIdentity.isArtistVerified(artist.address)).to.be.true;
      const profile = await artistIdentity.getArtist(artist.address);
      expect(profile.stageName).to.equal("DJ Cyberpunk");
      expect(profile.reputationScore).to.equal(100n);
    });

    it("Should revert transfer of Soulbound token", async function () {
      await artistIdentity.verifyArtist(artist.address, "DJ Cyberpunk", "ipfs://uri", 100);
      const tokenId = 1;

      await expect(
        artistIdentity.connect(artist).transferFrom(artist.address, fan1.address, tokenId)
      ).to.be.revertedWithCustomError(artistIdentity, "SoulboundNonTransferable");
    });
  });

  describe("3. MusicNFT (ERC-721 with ERC-2981 Royalties)", function () {
    it("Should mint music NFT and return correct royalty info", async function () {
      // Mint a song NFT with 10% royalty (1000 bps)
      const tx = await musicNFT.mintMusicNFT(
        fan1.address,
        "ipfs://song-metadata-uri",
        artist.address,
        1000, // 10%
        0 // SONG category
      );
      await tx.wait();

      expect(await musicNFT.ownerOf(1)).to.equal(fan1.address);

      // Check ERC-2981 royalty calculation for a sale of 1 ETH
      const salePrice = ethers.parseEther("1.0");
      const [receiver, royaltyAmount] = await musicNFT.royaltyInfo(1, salePrice);

      expect(receiver).to.equal(artist.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.1")); // 10% of 1.0 ETH
    });
  });

  describe("4. EventTicket (NFT Ticketing & Anti-Scalping)", function () {
    it("Should create tier, buy ticket, and perform gate check-in", async function () {
      const ticketPrice = ethers.parseEther("0.05");
      const eventTimestamp = (await time.latest()) + 7 * 24 * 60 * 60; // 7 days from now

      // Create tier
      await eventTicket.createTier(
        101, // eventId
        "VIP Festival Pass",
        ticketPrice,
        500, // max supply
        ethers.parseEther("0.06"), // max resale cap
        eventTimestamp,
        organizer.address
      );

      // Fan buys ticket
      const organizerBalBefore = await ethers.provider.getBalance(organizer.address);
      await eventTicket.connect(fan1).buyTicket(1, "ipfs://ticket-metadata-uri", {
        value: ticketPrice,
      });

      expect(await eventTicket.ownerOf(1)).to.equal(fan1.address);
      const organizerBalAfter = await ethers.provider.getBalance(organizer.address);
      expect(organizerBalAfter - organizerBalBefore).to.equal(ticketPrice);

      // Gate check-in by authorized staff
      await eventTicket.connect(gateKeeper).checkIn(1);

      const [isValid, , , isUsed] = await eventTicket.validateTicket(1);
      expect(isValid).to.be.false;
      expect(isUsed).to.be.true;

      // Check-in again should revert
      await expect(eventTicket.connect(gateKeeper).checkIn(1)).to.be.revertedWithCustomError(
        eventTicket,
        "TicketAlreadyUsed"
      );
    });

    it("Should prevent transferring a checked-in (used) ticket", async function () {
      const ticketPrice = ethers.parseEther("0.01");
      const eventTimestamp = (await time.latest()) + 7 * 24 * 60 * 60;

      await eventTicket.createTier(102, "General Admission", ticketPrice, 100, 0, eventTimestamp, organizer.address);
      await eventTicket.connect(fan1).buyTicket(1, "ipfs://uri", { value: ticketPrice });

      // Check-in
      await eventTicket.connect(gateKeeper).checkIn(1);

      // Try transferring used ticket to fan2
      await expect(
        eventTicket.connect(fan1).transferFrom(fan1.address, fan2.address, 1)
      ).to.be.revertedWithCustomError(eventTicket, "TicketAlreadyUsed");
    });
  });

  describe("5. RoyaltyDistribution (Automated Revenue Splitter)", function () {
    it("Should split and distribute incoming funds proportionately", async function () {
      const splitId = ethers.keccak256(ethers.toUtf8Bytes("festival-track-2026"));
      const payees = [artist.address, producer.address, organizer.address];
      const shares = [60, 30, 10]; // 60%, 30%, 10%

      await royaltyDist.createSplit(splitId, payees, shares);

      // Deposit 10 ETH revenue into split
      const revenue = ethers.parseEther("10.0");
      await royaltyDist.distribute(splitId, { value: revenue });

      // Check pending balances
      expect(await royaltyDist.pendingPayment(splitId, artist.address)).to.equal(ethers.parseEther("6.0"));
      expect(await royaltyDist.pendingPayment(splitId, producer.address)).to.equal(ethers.parseEther("3.0"));
      expect(await royaltyDist.pendingPayment(splitId, organizer.address)).to.equal(ethers.parseEther("1.0"));

      // Release payment to artist
      const artistBalBefore = await ethers.provider.getBalance(artist.address);
      await royaltyDist.release(splitId, artist.address);
      const artistBalAfter = await ethers.provider.getBalance(artist.address);

      expect(artistBalAfter - artistBalBefore).to.equal(ethers.parseEther("6.0"));
      expect(await royaltyDist.pendingPayment(splitId, artist.address)).to.equal(0n);
    });
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";
import type { MusicNFT } from "../typechain-types";

describe("MusicNFT Marketplace", function () {
  it("lists and buys an NFT while paying the ERC-2981 royalty", async function () {
    const [owner, artist, seller, buyer] = await ethers.getSigners();

    const MusicNFTFactory = await ethers.getContractFactory("MusicNFT");
    const musicNFT = (await MusicNFTFactory.deploy(owner.address)) as unknown as MusicNFT;
    await musicNFT.waitForDeployment();

    await musicNFT.mintMusicNFT(
      seller.address,
      "ipfs://marketplace-song",
      artist.address,
      1000,
      0
    );

    const price = ethers.parseEther("1");
    await musicNFT.connect(seller).listNFT(1, price);

    const artistBefore = await ethers.provider.getBalance(artist.address);
    const sellerBefore = await ethers.provider.getBalance(seller.address);

    await musicNFT.connect(buyer).buyNFT(1, { value: price });

    expect(await musicNFT.ownerOf(1)).to.equal(buyer.address);
    expect((await musicNFT.listings(1)).price).to.equal(0n);
    expect(
      (await ethers.provider.getBalance(artist.address)) - artistBefore
    ).to.equal(ethers.parseEther("0.1"));
    expect(
      (await ethers.provider.getBalance(seller.address)) - sellerBefore
    ).to.equal(ethers.parseEther("0.9"));
  });
});

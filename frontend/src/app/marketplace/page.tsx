"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BrowserProvider,
  Contract,
  formatEther,
  parseEther,
  ZeroAddress,
} from "ethers";

import type { Eip1193Provider } from "ethers";

import {
  Coins,
  LoaderCircle,
  Music2,
  Plus,
  RefreshCw,
} from "lucide-react";

import { useWallet } from "@/context/WalletContext";

const MUSIC_NFT_ADDRESS =
  process.env.NEXT_PUBLIC_MUSIC_NFT_ADDRESS ?? "";

const MUSIC_NFT_ABI = [
  "function totalMinted() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function itemDetails(uint256 tokenId) view returns (uint8 category,address originalCreator,uint256 mintedAt)",
  "function listings(uint256 tokenId) view returns (address seller,uint256 price)",
  "function royaltyInfo(uint256 tokenId,uint256 salePrice) view returns (address receiver,uint256 royaltyAmount)",
  "function mintMusicNFT(address recipient,string uri,address royaltyReceiver,uint96 royaltyFeeBps,uint8 category) returns (uint256)",
  "function listNFT(uint256 tokenId,uint256 price)",
  "function cancelListing(uint256 tokenId)",
  "function buyNFT(uint256 tokenId) payable",
];

const AMOY_GAS = {
  maxPriorityFeePerGas: BigInt("30000000000"),
  maxFeePerGas: BigInt("60000000000"),
};

const categories = [
  "SONG",
  "ALBUM",
  "VIP PASS",
  "COLLECTIBLE",
];

type NFTItem = {
  tokenId: number;
  owner: string;
  uri: string;
  category: number;
  creator: string;
  seller: string;
  price: bigint;
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function errorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate = error as {
      shortMessage?: string;
      reason?: string;
      message?: string;
    };

    return (
      candidate.shortMessage ??
      candidate.reason ??
      candidate.message ??
      "Transaction failed."
    );
  }

  return "Transaction failed.";
}

async function getContract(
  withSigner: boolean
) {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed."
    );
  }

  if (!MUSIC_NFT_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_MUSIC_NFT_ADDRESS is not configured."
    );
  }

  const provider = new BrowserProvider(
    window.ethereum as unknown as Eip1193Provider
  );

  const runner = withSigner
    ? await provider.getSigner()
    : provider;

  return new Contract(
    MUSIC_NFT_ADDRESS,
    MUSIC_NFT_ABI,
    runner
  );
}

export default function MarketplacePage() {
  const {
    address,
    isConnected,
    connectWallet,
  } = useWallet();

  const [items, setItems] =
    useState<NFTItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [busy, setBusy] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [uri, setUri] =
    useState(
      "ipfs://musiccoin-demo-metadata"
    );

  const [royalty, setRoyalty] =
    useState("10");

  const [category, setCategory] =
    useState(0);

  const loadNFTs = useCallback(
    async () => {
      if (!isConnected || !address) {
        return;
      }

      setLoading(true);
      setNotice("");

      try {
        const contract =
          await getContract(false);

        const total = Number(
          await contract.totalMinted()
        );

        const loaded =
          await Promise.all(
            Array.from(
              { length: total },
              async (_, index) => {
                const tokenId =
                  index + 1;

                const [
                  owner,
                  tokenUri,
                  details,
                  listing,
                ] =
                  await Promise.all([
                    contract.ownerOf(
                      tokenId
                    ) as Promise<string>,

                    contract.tokenURI(
                      tokenId
                    ) as Promise<string>,

                    contract.itemDetails(
                      tokenId
                    ),

                    contract.listings(
                      tokenId
                    ),
                  ]);

                return {
                  tokenId,
                  owner,
                  uri: tokenUri,

                  category: Number(
                    details.category
                  ),

                  creator:
                    details.originalCreator as string,

                  seller:
                    listing.seller as string,

                  price:
                    listing.price as bigint,
                } satisfies NFTItem;
              }
            )
          );

        setItems(
          loaded.reverse()
        );
      } catch (error) {
        setNotice(
          errorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    },
    [
      address,
      isConnected,
    ]
  );

  useEffect(() => {
    void loadNFTs();
  }, [loadNFTs]);

  async function mintNFT() {
    if (
      !isConnected ||
      !address
    ) {
      await connectWallet();
      return;
    }

    if (!uri.trim()) {
      setNotice(
        "Enter a metadata URI."
      );
      return;
    }

    const royaltyPercent =
      Number(royalty);

    if (
      !Number.isFinite(
        royaltyPercent
      ) ||
      royaltyPercent < 0 ||
      royaltyPercent > 25
    ) {
      setNotice(
        "Royalty must be between 0% and 25%."
      );

      return;
    }

    setBusy("mint");

    setNotice(
      "Confirm minting in MetaMask..."
    );

    try {
      const contract =
        await getContract(true);

      const tx =
        await contract.mintMusicNFT(
          address,
          uri.trim(),

          royaltyPercent > 0
            ? address
            : ZeroAddress,

          Math.round(
            royaltyPercent * 100
          ),

          category,

          AMOY_GAS
        );

      await tx.wait();

      setNotice(
        "NFT minted successfully on the blockchain."
      );

      await loadNFTs();
    } catch (error) {
      setNotice(
        errorMessage(error)
      );
    } finally {
      setBusy("");
    }
  }

  async function listNFT(
    tokenId: number
  ) {
    const price =
      window.prompt(
        "Enter listing price in test POL:",
        "0.01"
      );

    if (!price) {
      return;
    }

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice <= 0
    ) {
      setNotice(
        "Enter a valid listing price."
      );

      return;
    }

    setBusy(
      `list-${tokenId}`
    );

    setNotice(
      "Confirm listing in MetaMask..."
    );

    try {
      const contract =
        await getContract(true);

      const tx =
        await contract.listNFT(
          tokenId,
          parseEther(price),
          AMOY_GAS
        );

      await tx.wait();

      setNotice(
        `NFT #${tokenId} listed successfully.`
      );

      await loadNFTs();
    } catch (error) {
      setNotice(
        errorMessage(error)
      );
    } finally {
      setBusy("");
    }
  }

  async function cancelListing(
    tokenId: number
  ) {
    setBusy(
      `cancel-${tokenId}`
    );

    setNotice(
      "Confirm listing cancellation in MetaMask..."
    );

    try {
      const contract =
        await getContract(true);

      const tx =
        await contract.cancelListing(
          tokenId,
          AMOY_GAS
        );

      await tx.wait();

      setNotice(
        `Listing for NFT #${tokenId} cancelled.`
      );

      await loadNFTs();
    } catch (error) {
      setNotice(
        errorMessage(error)
      );
    } finally {
      setBusy("");
    }
  }

  async function buyNFT(
    item: NFTItem
  ) {
    setBusy(
      `buy-${item.tokenId}`
    );

    setNotice(
      "Confirm purchase in MetaMask..."
    );

    try {
      const contract =
        await getContract(true);

      const tx =
        await contract.buyNFT(
          item.tokenId,
          {
            value: item.price,
            ...AMOY_GAS,
          }
        );

      await tx.wait();

      setNotice(
        `NFT #${item.tokenId} purchased successfully.`
      );

      await loadNFTs();
    } catch (error) {
      setNotice(
        errorMessage(error)
      );
    } finally {
      setBusy("");
    }
  }

  const normalizedAddress =
    address?.toLowerCase();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <section className="mx-auto mb-10 max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/30 px-3.5 py-1 text-xs font-semibold text-pink-300">
          <Music2 className="h-3.5 w-3.5" />

          Real ERC-721 + ERC-2981 Marketplace
        </div>

        <h1 className="text-3xl font-extrabold text-white sm:text-5xl">
          Music NFT Marketplace
        </h1>

        <p className="mt-3 text-sm text-neutral-400">
          Mint, list and purchase collectibles
          through MetaMask. Royalties are paid
          automatically.
        </p>
      </section>

      <section className="mb-10 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
          <Plus className="h-5 w-5 text-purple-400" />
          Mint a Music NFT
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-neutral-300 md:col-span-3">
            Metadata URI

            <input
              value={uri}
              onChange={(
                event
              ) =>
                setUri(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </label>

          <label className="text-sm text-neutral-300">
            Category

            <select
              value={category}
              onChange={(
                event
              ) =>
                setCategory(
                  Number(
                    event.target
                      .value
                  )
                )
              }
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white"
            >
              {categories.map(
                (
                  name,
                  index
                ) => (
                  <option
                    key={name}
                    value={index}
                  >
                    {name}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="text-sm text-neutral-300">
            Royalty percentage

            <input
              type="number"
              min="0"
              max="25"
              step="0.1"
              value={royalty}
              onChange={(
                event
              ) =>
                setRoyalty(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              void mintNFT()
            }
            disabled={
              busy === "mint"
            }
            className="mt-6 rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
          >
            {busy === "mint"
              ? "Minting..."
              : "Mint NFT"}
          </button>
        </div>
      </section>

      {notice && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-950/30 px-4 py-3 text-sm text-purple-200">
          {notice}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          On-chain Collection
        </h2>

        <button
          type="button"
          onClick={() =>
            void loadNFTs()
          }
          className="rounded-lg border border-neutral-700 p-2 text-neutral-300 hover:text-white"
          aria-label="Refresh NFTs"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />
        </button>
      </div>

      {!isConnected ? (
        <button
          type="button"
          onClick={() =>
            void connectWallet()
          }
          className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white"
        >
          Connect Wallet
        </button>
      ) : loading ? (
        <div className="flex items-center gap-2 text-neutral-400">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading blockchain NFTs...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-700 p-12 text-center text-neutral-400">
          No NFTs minted yet. Mint the first one
          above.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(
            (item) => {
              const owned =
                item.owner.toLowerCase() ===
                normalizedAddress;

              const listed =
                item.price >
                BigInt(0);

              const ownListing =
                item.seller.toLowerCase() ===
                normalizedAddress;

              return (
                <article
                  key={
                    item.tokenId
                  }
                  className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/70"
                >
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-purple-900 via-fuchsia-900 to-neutral-950">
                    <Music2 className="h-20 w-20 text-white/80" />
                  </div>

                  <div className="p-5">
                    <div className="mb-2 flex justify-between text-xs text-purple-300">
                      <span>
                        {
                          categories[
                            item
                              .category
                          ]
                        }
                      </span>

                      <span>
                        #
                        {
                          item.tokenId
                        }
                      </span>
                    </div>

                    <h3
                      className="truncate font-bold text-white"
                      title={
                        item.uri
                      }
                    >
                      {item.uri}
                    </h3>

                    <div className="mt-3 space-y-1 text-xs text-neutral-400">
                      <p>
                        Owner:{" "}
                        {shortAddress(
                          item.owner
                        )}
                      </p>

                      <p>
                        Creator:{" "}
                        {shortAddress(
                          item.creator
                        )}
                      </p>
                    </div>

                    {listed && (
                      <p className="mt-4 text-lg font-bold text-white">
                        {formatEther(
                          item.price
                        )}{" "}
                        test POL
                      </p>
                    )}

                    <div className="mt-4">
                      {owned &&
                        !listed && (
                          <button
                            type="button"
                            onClick={() =>
                              void listNFT(
                                item.tokenId
                              )
                            }
                            disabled={
                              busy !==
                              ""
                            }
                            className="w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            {busy ===
                            `list-${item.tokenId}`
                              ? "Listing..."
                              : "List for Sale"}
                          </button>
                        )}

                      {ownListing && (
                        <button
                          type="button"
                          onClick={() =>
                            void cancelListing(
                              item.tokenId
                            )
                          }
                          disabled={
                            busy !== ""
                          }
                          className="w-full rounded-xl border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-300"
                        >
                          {busy ===
                          `cancel-${item.tokenId}`
                            ? "Cancelling..."
                            : "Cancel Listing"}
                        </button>
                      )}

                      {listed &&
                        !ownListing && (
                          <button
                            type="button"
                            onClick={() =>
                              void buyNFT(
                                item
                              )
                            }
                            disabled={
                              busy !==
                              ""
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            <Coins className="h-4 w-4" />

                            {busy ===
                            `buy-${item.tokenId}`
                              ? "Buying..."
                              : "Buy NFT"}
                          </button>
                        )}

                      {!owned &&
                        !listed && (
                          <p className="text-center text-xs text-neutral-500">
                            Not listed for sale
                          </p>
                        )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </section>
      )}
    </main>
  );
}
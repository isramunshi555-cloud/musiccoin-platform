// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RoyaltyDistribution
 * @notice Automated on-chain revenue splitter for Artists, Producers, Labels, and Organizers.
 */
contract RoyaltyDistribution is Ownable, ReentrancyGuard {
    struct Split {
        address[] payees;
        uint256[] shares;
        uint256 totalShares;
        uint256 totalReceived;
        mapping(address => uint256) released;
        bool exists;
    }

    mapping(bytes32 => Split) private _splits;

    event SplitCreated(bytes32 indexed splitId, address[] payees, uint256[] shares, uint256 totalShares);
    event PaymentReceived(bytes32 indexed splitId, address indexed from, uint256 amount);
    event PaymentReleased(bytes32 indexed splitId, address indexed to, uint256 amount);

    error SplitAlreadyExists();
    error SplitNotFound();
    error InvalidPayees();
    error NoShares();
    error LengthMismatch();
    error ZeroAddress();
    error NoFundsDue();
    error PaymentFailed();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Registers a new multi-party revenue split.
     * @param splitId Unique identifier (hash of trackId/eventId).
     * @param payees Array of recipient addresses.
     * @param shares Array of proportionate shares.
     */
    function createSplit(
        bytes32 splitId,
        address[] calldata payees,
        uint256[] calldata shares
    ) external onlyOwner {
        if (_splits[splitId].exists) revert SplitAlreadyExists();
        if (payees.length == 0) revert InvalidPayees();
        if (payees.length != shares.length) revert LengthMismatch();

        uint256 total = 0;
        for (uint256 i = 0; i < payees.length; i++) {
            if (payees[i] == address(0)) revert ZeroAddress();
            if (shares[i] == 0) revert NoShares();
            total += shares[i];
        }

        Split storage s = _splits[splitId];
        s.payees = payees;
        s.shares = shares;
        s.totalShares = total;
        s.exists = true;

        emit SplitCreated(splitId, payees, shares, total);
    }

    /**
     * @notice Send revenue to be divided according to split configuration.
     */
    function distribute(bytes32 splitId) external payable {
        if (!_splits[splitId].exists) revert SplitNotFound();
        if (msg.value == 0) revert NoFundsDue();

        _splits[splitId].totalReceived += msg.value;
        emit PaymentReceived(splitId, msg.sender, msg.value);
    }

    /**
     * @notice Calculate withdrawable pending funds for a payee on a given split.
     */
    function pendingPayment(bytes32 splitId, address payee) public view returns (uint256) {
        Split storage s = _splits[splitId];
        if (!s.exists) return 0;

        uint256 share = 0;
        for (uint256 i = 0; i < s.payees.length; i++) {
            if (s.payees[i] == payee) {
                share = s.shares[i];
                break;
            }
        }
        if (share == 0) return 0;

        uint256 totalReceived = s.totalReceived;
        uint256 alreadyReleased = s.released[payee];
        uint256 totalEntitled = (totalReceived * share) / s.totalShares;

        if (totalEntitled <= alreadyReleased) return 0;
        return totalEntitled - alreadyReleased;
    }

    /**
     * @notice Release due revenue share to payee.
     */
    function release(bytes32 splitId, address payable payee) external nonReentrant {
        if (!_splits[splitId].exists) revert SplitNotFound();

        uint256 payment = pendingPayment(splitId, payee);
        if (payment == 0) revert NoFundsDue();

        _splits[splitId].released[payee] += payment;

        (bool success, ) = payee.call{value: payment}("");
        if (!success) revert PaymentFailed();

        emit PaymentReleased(splitId, payee, payment);
    }

    /**
     * @notice Release funds for all payees in a split in one batch transaction.
     */
    function releaseAll(bytes32 splitId) external nonReentrant {
        Split storage s = _splits[splitId];
        if (!s.exists) revert SplitNotFound();

        for (uint256 i = 0; i < s.payees.length; i++) {
            address payee = s.payees[i];
            uint256 payment = pendingPayment(splitId, payee);
            if (payment > 0) {
                s.released[payee] += payment;
                (bool success, ) = payable(payee).call{value: payment}("");
                if (!success) revert PaymentFailed();
                emit PaymentReleased(splitId, payee, payment);
            }
        }
    }

    function getSplitDetails(bytes32 splitId) external view returns (
        address[] memory payees,
        uint256[] memory shares,
        uint256 totalShares,
        uint256 totalReceived,
        bool exists
    ) {
        Split storage s = _splits[splitId];
        return (s.payees, s.shares, s.totalShares, s.totalReceived, s.exists);
    }
}

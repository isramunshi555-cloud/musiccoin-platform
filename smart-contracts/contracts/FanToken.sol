// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FanToken (MUSIC)
 * @notice Native utility, staking, and governance token for the MusicCoin Festival Platform.
 */
contract FanToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable, ReentrancyGuard {
    struct StakingPosition {
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration; // in seconds
        uint256 rewardRateBps; // basis points APY (e.g., 500 = 5%)
        uint256 lastClaimTime;
        bool active;
    }

    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Mapping from user to their staking positions
    mapping(address => StakingPosition[]) public userStakes;
    mapping(address => bool) public minters;

    uint256 public totalStaked;

    // Events
    event Staked(address indexed user, uint256 indexed positionId, uint256 amount, uint256 lockDuration, uint256 rewardRateBps);
    event Unstaked(address indexed user, uint256 indexed positionId, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 indexed positionId, uint256 reward);
    event MinterUpdated(address indexed minter, bool status);

    error InvalidAmount();
    error InvalidDuration();
    error PositionNotActive();
    error LockPeriodNotEnded();
    error NotMinter();

    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) revert NotMinter();
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(initialOwner) {
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
        minters[initialOwner] = true;
    }

    function setMinter(address minter, bool status) external onlyOwner {
        minters[minter] = status;
        emit MinterUpdated(minter, status);
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    /**
     * @notice Stakes MUSIC tokens for a selected lock period.
     * @param amount Amount of MUSIC tokens to stake.
     * @param lockDuration Duration in seconds (30 days, 90 days, 180 days, 365 days).
     */
    function stake(uint256 amount, uint256 lockDuration) external nonReentrant {
        if (amount == 0) revert InvalidAmount();

        uint256 rewardRateBps;
        if (lockDuration == 30 days) {
            rewardRateBps = 500; // 5% APY
        } else if (lockDuration == 90 days) {
            rewardRateBps = 1000; // 10% APY
        } else if (lockDuration == 180 days) {
            rewardRateBps = 1500; // 15% APY
        } else if (lockDuration == 365 days) {
            rewardRateBps = 2500; // 25% APY
        } else {
            revert InvalidDuration();
        }

        _transfer(msg.sender, address(this), amount);
        totalStaked += amount;

        userStakes[msg.sender].push(
            StakingPosition({
                amount: amount,
                startTime: block.timestamp,
                lockDuration: lockDuration,
                rewardRateBps: rewardRateBps,
                lastClaimTime: block.timestamp,
                active: true
            })
        );

        uint256 positionId = userStakes[msg.sender].length - 1;
        emit Staked(msg.sender, positionId, amount, lockDuration, rewardRateBps);
    }

    /**
     * @notice Calculate pending reward for a staking position.
     */
    function calculateReward(address user, uint256 positionId) public view returns (uint256) {
        if (positionId >= userStakes[user].length) return 0;
        StakingPosition memory pos = userStakes[user][positionId];
        if (!pos.active) return 0;

        uint256 endTime = pos.startTime + pos.lockDuration;
        uint256 calcTime = block.timestamp > endTime ? endTime : block.timestamp;

        if (calcTime <= pos.lastClaimTime) return 0;

        uint256 duration = calcTime - pos.lastClaimTime;
        uint256 reward = (pos.amount * pos.rewardRateBps * duration) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
        return reward;
    }

    /**
     * @notice Claims accrued staking reward.
     */
    function claimReward(uint256 positionId) public nonReentrant {
        if (positionId >= userStakes[msg.sender].length) revert PositionNotActive();
        StakingPosition storage pos = userStakes[msg.sender][positionId];
        if (!pos.active) revert PositionNotActive();

        uint256 reward = calculateReward(msg.sender, positionId);
        pos.lastClaimTime = block.timestamp;

        if (reward > 0) {
            _mint(msg.sender, reward);
            emit RewardClaimed(msg.sender, positionId, reward);
        }
    }

    /**
     * @notice Unstakes tokens after the lock period has expired.
     */
    function unstake(uint256 positionId) external nonReentrant {
        if (positionId >= userStakes[msg.sender].length) revert PositionNotActive();
        StakingPosition storage pos = userStakes[msg.sender][positionId];
        if (!pos.active) revert PositionNotActive();
        if (block.timestamp < pos.startTime + pos.lockDuration) revert LockPeriodNotEnded();

        uint256 reward = calculateReward(msg.sender, positionId);
        uint256 principal = pos.amount;

        pos.active = false;
        totalStaked -= principal;

        _transfer(address(this), msg.sender, principal);

        if (reward > 0) {
            _mint(msg.sender, reward);
        }

        emit Unstaked(msg.sender, positionId, principal, reward);
    }

    function getUserStakeCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }

    // Required overrides for ERC20Votes & ERC20
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}

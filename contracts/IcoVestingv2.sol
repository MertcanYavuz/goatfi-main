// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Vesting is Ownable {
    using SafeMath for uint256;

    uint256 public icoStartTime;
    uint256 public icoEndTime;
    uint256 public vestingStartTime;
    uint256 public tokenPriceRate;
    uint256 public tokenSold;
    uint256 public maxSaleLimit = 10000000 * 1e18;
    bool public isICOPaused;
    bool public isClaimingEnabled;

    IERC20 public tokenAddress;
    IERC20 public usdtTokenAddress;

    enum Roles {
        PUBLIC,
        PRIVATE,
        SEED,
        MAX_ROLE
    }

    struct Beneficiary {
        Roles role;
        uint256 tokenBalance;
        uint256 claimedBalance;
    }

    struct VestingSchedule {
        uint256 TGE;
        uint256 cliff;
        uint256 period;
        uint256 installments;
    }

    struct BuyLimits {
        uint256 minPurchase;
        uint256 maxPurchase;
        uint256 tokenPriceRate;
    }

    mapping(address => Beneficiary) public beneficiaryMap; // Beneficiary accounts with total and unclaimed balance
    mapping(Roles => VestingSchedule) public vestingScheduleMap; // Vesting schedule for roles
    mapping(Roles => BuyLimits) public buyLimits; // Min and max purchase limit for roles
    event TokensPurchased(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);

    constructor(
        address _tokenAddress,
        address _usdtTokenAddress,
        uint256 _icoStartTime,
        uint256 _icoEndTime
    ) Ownable(msg.sender) {
        tokenAddress = IERC20(_tokenAddress);
        usdtTokenAddress = IERC20(_usdtTokenAddress);
        icoStartTime = _icoStartTime;
        icoEndTime = _icoEndTime;
        tokenPriceRate = 111e12; //0.009usdt -> 1e6 => 111e12

        _initialize();
    }

    function _initialize() internal onlyOwner {
        setVestingSchedule(Roles.PUBLIC, 20, 30 days, 30 days, 8);
        setVestingSchedule(Roles.PRIVATE, 10, 120 days, 30 days, 12);
        setVestingSchedule(Roles.SEED, 5, 210 days, 30 days, 12);

        setBuyLimits(Roles.PUBLIC, 10 * 1e6, 500 * 1e6, 11111e10); // 1e6 / 0.009 * 1e18
        setBuyLimits(Roles.PRIVATE, 10 * 1e6, 5000 * 1e6, 11764e10); // 1e6 / 0.0085 * 1e18
        setBuyLimits(Roles.SEED, 10 * 1e6, 10000 * 1e6, 125e12); // 1e6 / 0.008 * 1e18
    }

    function buyToken(uint256 _usdtAmount) external {
        require(block.timestamp > icoStartTime, "ICO isn't started");
        require(block.timestamp < icoEndTime, "ICO is done");
        require(!isICOPaused, "ICO is paused");
        require(_checkBuyLimit(_usdtAmount), "Invalid purchase amount");
        require(
            _checkAllowanceUSDT(_usdtAmount),
            "Insufficient allowance for transfer"
        );
        uint256 tokenAmount = _calculateTokenAmountFromUSDT(_usdtAmount);
        require(
            tokenSold + tokenAmount <= maxSaleLimit,
            "Maximum sale limit reached"
        );

        bool transferSuccess = usdtTokenAddress.transferFrom(
            msg.sender,
            address(this),
            _usdtAmount
        ); // Transfer USDT from address to this contract
        require(transferSuccess, "USDT transfer failed");

        beneficiaryMap[msg.sender].tokenBalance += tokenAmount; // Calculate and add token balance to the buyer address
        tokenSold += tokenAmount;

        emit TokensPurchased(msg.sender, tokenAmount);
    }

    function claimVestedTokens() external {
        require(isClaimingEnabled, "Claiming tokens is disabled");
        require(block.timestamp >= icoEndTime, "Sale has not ended");
        require(
            block.timestamp > vestingStartTime && vestingStartTime > 0,
            "Vesting hasn't started yet or start time is invalid"
        );
        uint256 totalAmount = beneficiaryMap[msg.sender].tokenBalance;
        uint256 claimedAmount = beneficiaryMap[msg.sender].claimedBalance;
        uint256 claimableAmount = _calculateClaimableAmount(
            msg.sender,
            totalAmount,
            claimedAmount
        );
        require(totalAmount > 0, "No tokens to claim");
        require(totalAmount > claimedAmount, "There is no unclaimed tokens");
        require(claimableAmount > 0, "Claimable token amount is zero");

        beneficiaryMap[msg.sender].claimedBalance += claimableAmount;
        IERC20(tokenAddress).transfer(msg.sender, claimableAmount);

        emit Claimed(msg.sender, claimableAmount);
    }

    // INTERNAL

    function _checkAllowanceUSDT(
        uint256 _usdtAmount
    ) internal view returns (bool) {
        return
            _usdtAmount <=
            usdtTokenAddress.allowance(msg.sender, address(this)); // Allowance check for USDT amount to spend by this contract
    }

    function _calculateTokenAmountFromUSDT(
        uint256 _usdtAmount
    ) internal view returns (uint256) {
        require(_usdtAmount > 0, "Buying amount is zero");
        Roles _beneficiaryRole = beneficiaryMap[msg.sender].role;
        uint256 _tokenPriceRate = buyLimits[_beneficiaryRole].tokenPriceRate;
        uint256 tokenAmount = _usdtAmount.mul(_tokenPriceRate);

        return tokenAmount;
    }

    function _checkBuyLimit(uint256 _usdtAmount) internal view returns (bool) {
        Roles _beneficiaryRole = beneficiaryMap[msg.sender].role;
        uint256 _minPurchase = buyLimits[_beneficiaryRole].minPurchase;
        uint256 _maxPurchase = buyLimits[_beneficiaryRole].maxPurchase;
        uint256 _tokenPriceRate = buyLimits[_beneficiaryRole].tokenPriceRate;
        uint256 _tokenBalance = beneficiaryMap[msg.sender].tokenBalance;
        uint256 _tokenBalanceAsUSDT = _tokenBalance / _tokenPriceRate;
        uint256 totalBuyingAmount = _usdtAmount + _tokenBalanceAsUSDT; // USDT

        return
            _minPurchase <= totalBuyingAmount &&
            totalBuyingAmount <= _maxPurchase;
    }

    function _calculateClaimableAmount(
        address _address,
        uint _totalAmount,
        uint _claimedAmount
    ) internal view returns (uint) {
        Roles role = getRole(_address);
        uint256 availableAmount = 0;
        uint256 TGEAmount = (_totalAmount * vestingScheduleMap[role].TGE) / 100;
        uint256 cliff = vestingScheduleMap[role].cliff;
        uint256 period = vestingScheduleMap[role].period;
        uint256 installments = vestingScheduleMap[role].installments;
        uint256 currentPeriod = _getCurrentPeriod(cliff, period, installments);
        uint256 installmentAmount = _calculateInstallmentAmount(
            _totalAmount,
            TGEAmount,
            installments
        );
        uint256 availableInstallments;
        uint256 claimedInstallments;
        bool isCliffPassed = _checkCliffPassed(cliff);

        if (_claimedAmount == 0) {
            availableAmount = TGEAmount;
        }

        if (isCliffPassed) {
            availableInstallments = currentPeriod * installmentAmount;
            if (currentPeriod >= installments) {
                availableAmount = _totalAmount - _claimedAmount;
            } else if (_claimedAmount == 0) {
                availableAmount += availableInstallments;
            } else {
                claimedInstallments = _claimedAmount - TGEAmount;
                availableAmount += availableInstallments - claimedInstallments;
            }
        }

        return availableAmount;
    }

    function _calculateInstallmentAmount(
        uint256 _total,
        uint256 _TGEAmount,
        uint256 _installment
    ) internal pure returns (uint) {
        return (_total - _TGEAmount) / _installment;
    }

    function _getCurrentPeriod(
        uint256 _cliff,
        uint256 _period,
        uint256 _installments
    ) internal view returns (uint) {
        uint256 currentTime = block.timestamp;

        if (currentTime - vestingStartTime < _cliff) {
            return 0;
        }

        uint256 elapsedFromCliff = currentTime - vestingStartTime - _cliff;
        uint256 currentPeriod = elapsedFromCliff / _period + 1;

        return currentPeriod > _installments ? _installments : currentPeriod;
    }

    function _checkCliffPassed(
        uint256 _cliffTime
    ) internal view returns (bool) {
        return (block.timestamp >= vestingStartTime + _cliffTime);
    }

    // GETTERS

    function getRole(address _address) public view returns (Roles) {
        return beneficiaryMap[_address].role;
    }

    function getTotalBalance(address _address) public view returns (uint) {
        return beneficiaryMap[_address].tokenBalance;
    }

    function getClaimedBalance(address _address) public view returns (uint) {
        return beneficiaryMap[_address].claimedBalance;
    }

    function getMinPurchase(address _address) public view returns (uint) {
        return buyLimits[beneficiaryMap[_address].role].minPurchase;
    }

    function getMaxPurchase(address _address) public view returns (uint) {
        return buyLimits[beneficiaryMap[_address].role].maxPurchase;
    }

    function getTokenSold() public view returns (uint) {
        return tokenSold;
    }

    function getRemainingBalance(address _address) public view returns (uint) {
        return
            beneficiaryMap[_address].tokenBalance -
            beneficiaryMap[_address].claimedBalance;
    }

    function getTokenPriceRate(address _address) public view returns (uint) {
        Roles role = beneficiaryMap[_address].role;
        return buyLimits[role].tokenPriceRate;
    }

    function getAvailableBalance(address _address) public view returns (uint) {
        uint256 totalAmount = getTotalBalance(_address);
        uint256 claimedAmount = getClaimedBalance(_address);
        uint256 claimableAmount = _calculateClaimableAmount(
            _address,
            totalAmount,
            claimedAmount
        );

        if (block.timestamp < vestingStartTime || vestingStartTime == 0) {
            return 0;
        }

        return claimableAmount;
    }

    function getLockedAmount(address _address) public view returns (uint) {
        return
            getTotalBalance(_address) -
            getClaimedBalance(_address) -
            getAvailableBalance(_address);
    }

    function getMaxSaleLimit() public view returns (uint) {
        return maxSaleLimit;
    }

    function getNextPeriodDate() public view returns (uint) {
        require(vestingStartTime > 0, "Vesting isn't started");
        uint256 currentTime = block.timestamp;
        uint nextPeriodDate = (currentTime - vestingStartTime) % 30 days;

        return 30 days - nextPeriodDate;
    }

    // SETTERS

    function setMinPurchase(Roles _role, uint _amount) external onlyOwner {
        buyLimits[_role].minPurchase = _amount;
    }

    function setMaxPurchase(Roles _role, uint _amount) external onlyOwner {
        buyLimits[_role].maxPurchase = _amount;
    }

    function setIsICOPaused(bool _paused) external onlyOwner {
        isICOPaused = _paused;
    }

    function setIsClaimingEnabled(bool _isEnabled) external onlyOwner {
        require(vestingStartTime > 0, "VestingTime hasn't been setted");
        isClaimingEnabled = _isEnabled;
    }

    function setICOStartTime(uint256 _startTime) external onlyOwner {
        icoEndTime = _startTime;
    }

    function setICOEndTime(uint256 _endTime) external onlyOwner {
        icoEndTime = _endTime;
    }

    function setVestingStartTime(uint256 _startTime) external onlyOwner {
        vestingStartTime = _startTime;
    }

    function setMaxSaleLimit(uint256 _amount) external onlyOwner {
        maxSaleLimit = _amount;
    }

    function setTokenAddress(address _tokenAddress) external onlyOwner {
        tokenAddress = IERC20(_tokenAddress);
    }

    function setVestingSchedule(
        Roles _role,
        uint256 _TGE,
        uint256 _cliff,
        uint256 _period,
        uint256 _installments
    ) public onlyOwner {
        require(
            uint8(_role) < uint8(Roles.MAX_ROLE),
            "Role must be in the roles"
        );
        require(_TGE <= 100, "TGE must not bigger than 100");
        require(_period > 0, "Period must not be zero");
        require(_installments > 0, "Installments must not be zero");

        vestingScheduleMap[_role].TGE = _TGE;
        vestingScheduleMap[_role].cliff = _cliff;
        vestingScheduleMap[_role].period = _period;
        vestingScheduleMap[_role].installments = _installments;
    }

    function setBuyLimits(
        Roles _role,
        uint256 _minPurchase,
        uint256 _maxPurchase,
        uint256 _tokenPriceRate
    ) public onlyOwner {
        require(
            uint8(_role) < uint8(Roles.MAX_ROLE),
            "Role must be in the roles"
        );
        buyLimits[_role].minPurchase = _minPurchase;
        buyLimits[_role].maxPurchase = _maxPurchase;
        buyLimits[_role].tokenPriceRate = _tokenPriceRate;
    }

    // Emergency Withdraw

    function withdrawEth() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawTokens() external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner(), balance);
    }

    //------------------------------------------

    // TEST

    function addWhitelist() public {
        beneficiaryMap[msg.sender].role = Roles.PRIVATE;
    }

    function addWhitelist(address _WLAddress) public {
        beneficiaryMap[_WLAddress].role = Roles.PRIVATE;
    }

    // ------------------------------------------
}

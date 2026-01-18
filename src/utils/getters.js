import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
  USDT_TOKEN_CONTRACT_ABI,
  USDT_TOKEN_CONTRACT_ADDRESS,
} from "../../constants";

export const getRole = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const role = await exchangeContract.getRole(address);
    return role;
  } catch (err) {
    console.error(err);
  }
};

export const getBeneficaryTotalBalance = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const totalBalance = await exchangeContract.getTotalBalance(address);
    return totalBalance;
  } catch (err) {
    console.error(err);
  }
};

export const getClaimedBalance = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const claimedBalance = await exchangeContract.getClaimedBalance(address);
    return claimedBalance;
  } catch (err) {
    console.error(err);
  }
};

export const getMinPurchase = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const minPurchase = await exchangeContract.getMinPurchase(address);
    return minPurchase;
  } catch (err) {
    console.error(err);
  }
};

export const getMaxPurchase = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const maxPurchase = await exchangeContract.getMaxPurchase(address);
    return maxPurchase;
  } catch (err) {
    console.error(err);
  }
};

export const getTokenSold = async (provider) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const tokenSold = await exchangeContract.getTokenSold();
    return tokenSold;
  } catch (err) {
    console.error(err);
  }
};

export const getRemainingBalance = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const remainingBalance = await exchangeContract.getRemainingBalance(address);
    return remainingBalance;
  } catch (err) {
    console.error(err);
  }
};

export const getTokenPriceRate = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const tokenPrice = await exchangeContract.getTokenPriceRate(address);
    return tokenPrice;
  } catch (err) {
    console.error(err);
  }
};

export const getAvailableBalance = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const availableBalance = await exchangeContract.getAvailableBalance(address);
    return availableBalance;
  } catch (err) {
    console.error(err);
  }
};

export const getLockedAmount = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const lockedAmount = await exchangeContract.getLockedAmount(address);
    return lockedAmount;
  } catch (err) {
    console.error(err);
  }
};

export const getNextPeriodDate = async (provider) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const nextPeriodDate = await exchangeContract.getNextPeriodDate();
    return nextPeriodDate;
  } catch (err) {
    console.error(err);
  }
};

export const getUSDTAllowance = async (provider, address) => {
  try {
    const usdtTokenContract = new Contract(
      USDT_TOKEN_CONTRACT_ADDRESS,
      USDT_TOKEN_CONTRACT_ABI,
      provider
    );
    const usdtAllowance = await usdtTokenContract.allowance(address, EXCHANGE_CONTRACT_ADDRESS);
    return usdtAllowance;
  } catch (err) {
    console.error(err);
  }
};

export const getGOATTokenBalance = async (provider, address) => {
  try {
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider
    );
    const balanceOfGOATTokens = await tokenContract.balanceOf(address);
    return balanceOfGOATTokens;
  } catch (err) {
    console.error(err);
  }
};

export const getUSDTTokenBalance = async (provider, address) => {
  try {
    const usdtTokenContract = new Contract(
      USDT_TOKEN_CONTRACT_ADDRESS,
      USDT_TOKEN_CONTRACT_ABI,
      provider
    );
    const balanceOfUSDTTokens = await usdtTokenContract.balanceOf(address);
    return balanceOfUSDTTokens;
  } catch (err) {
    console.error(err);
  }
};

export const getVestingScheduleMap = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const vestingSchedule = await exchangeContract.vestingScheduleMap(0);
    return vestingSchedule;
  } catch (err) {
    console.error(err);
  }
};

export const getIsClaimingEnabled = async (provider) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const isClaimingEnabled = await exchangeContract.isClaimingEnabled();
    return isClaimingEnabled;
  } catch (err) {
    console.error(err);
  }
};
export const getMaxSaleLimit = async (provider) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const maxSaleLimit = await exchangeContract.maxSaleLimit();
    return maxSaleLimit;
  } catch (err) {
    console.error(err);
  }
};


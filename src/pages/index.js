import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";

import { buyToken } from "../utils/buyToken";
import { claimToken } from "../utils/claimVesting";
import {
  getRole,
  getBeneficaryTotalBalance,
  getClaimedBalance,
  getMinPurchase,
  getMaxPurchase,
  getTokenSold,
  getRemainingBalance,
  getTokenPriceRate,
  getAvailableBalance,
  getLockedAmount,
  getNextPeriodDate,
  getUSDTAllowance,
  getGOATTokenBalance,
  getUSDTTokenBalance,
  getVestingScheduleMap,
  getIsClaimingEnabled,
  getMaxSaleLimit
} from "../utils/getters";


export default function Home() {
  const [loading, setLoading] = useState(false);
  const [vestingTab, setVestingTab] = useState(true);
  const zero = BigNumber.from(0);

  const [role, setRole] = useState(zero);
  const [beneficaryTotalBalance, setBeneficaryTotalBalance] = useState(zero);
  const [claimedBalance, setClaimedBalance] = useState(zero);
  const [minPurchase, setMinPurchase] = useState(zero);
  const [maxPurchase, setMaxPurchase] = useState(zero);
  const [tokenSold, setTokenSold] = useState(zero);
  const [remainingBalance, setRemainingBalance] = useState(zero);
  const [tokenPriceRate, setTokenPriceRate] = useState(zero);
  const [availableBalance, setAvailableBalance] = useState(zero);
  const [lockedAmount, setLockedAmount] = useState(zero);
  const [nextPeriodDate, setNextPeriodDate] = useState(zero);
  const [usdtAllowance, setUsdtAllowance] = useState(zero);
  const [goatTokenBalance, setGoatTokenBalance] = useState(zero);
  const [usdtTokenBalance, setUsdtTokenBalance] = useState(zero);
  const [buyAmount, setBuyAmount] = useState("");
  const [goatTokenToBeReceived, setGoatTokenToBeReceived] = useState(zero);
  const [vestingScheduleMap, setVestingScheduleMap] = useState(zero);
  const [isClaimingEnabled, setIsClaimingEnabled] = useState(false);
  const [maxSaleLimit, setMaxSaleLimit] = useState(false);

  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);


  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      const _role = await getRole(provider, address);
      const _beneficaryTotalBalance = await getBeneficaryTotalBalance(provider, address);
      const _claimedBalance = await getClaimedBalance(provider, address);
      const _minPurchase = await getMinPurchase(provider, address);
      const _maxPurchase = await getMaxPurchase(provider, address);
      const _tokenSold = await getTokenSold(provider);
      const _remainingBalance = await getRemainingBalance(provider, address);
      const _tokenPriceRate = await getTokenPriceRate(provider, address);
      const _availableBalance = await getAvailableBalance(provider, address);
      const _lockedAmount = await getLockedAmount(provider, address);
      const _nextPeriodDate = await getNextPeriodDate(provider);
      const _usdtAllowance = await getUSDTAllowance(provider, address);
      const _goatTokenBalance = await getGOATTokenBalance(provider, address);
      const _usdtTokenBalance = await getUSDTTokenBalance(provider, address);
      const _vestingScheduleMap = await getVestingScheduleMap(provider, address);
      const _isClaimingEnabled = await getIsClaimingEnabled(provider);
      const _maxSaleLimit = await getMaxSaleLimit(provider);

      setRole(_role);
      setBeneficaryTotalBalance(_beneficaryTotalBalance);
      setClaimedBalance(_claimedBalance);
      setMinPurchase(_minPurchase);
      setMaxPurchase(_maxPurchase);
      setTokenSold(_tokenSold);
      setRemainingBalance(_remainingBalance);
      setTokenPriceRate(_tokenPriceRate);
      setAvailableBalance(_availableBalance);
      setLockedAmount(_lockedAmount);
      setNextPeriodDate(_nextPeriodDate);
      setUsdtAllowance(_usdtAllowance);
      setGoatTokenBalance(_goatTokenBalance);
      setUsdtTokenBalance(_usdtTokenBalance);
      setVestingScheduleMap(_vestingScheduleMap);
      setIsClaimingEnabled(_isClaimingEnabled);
      setMaxSaleLimit(_maxSaleLimit);

    } catch (err) {
      console.error(err);
    }
  };

  const _buyTokens = async () => {
    try {
      const buyAmountDecimals = buyAmount * 10 ** 6;
      if (!buyAmountDecimals == 0) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        let allowanceAmount = usdtAllowance * 1;
        await buyToken(
          signer,
          buyAmountDecimals,
          allowanceAmount
        );
        setLoading(false);

        setBuyAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setBuyAmount("");
    }
  };

  const _claimToken = async () => {
    try {
      if (isClaimingEnabled) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await claimToken(
          signer
        );
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const _getAmountOfGOATTokensReceived = async (_buyAmount) => {
    try {
      if (!_buyAmount == 0) {
        const amountOfTokens = _buyAmount * tokenPriceRate / 10 ** 12; // 10**18 / 10**6 = 10**12
        setGoatTokenToBeReceived(amountOfTokens);
      } else {
        setGoatTokenToBeReceived(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Goerli network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 11155111) {
      window.alert("Change the network to Sepolia");
      throw new Error("Change network to Sepolia");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting its `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "Sepolia",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (vestingTab) {
      return (
        <div>
          <div className={styles.description}>
            <div>
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                <br />
                {`Total Balance: ${utils.formatEther(beneficaryTotalBalance)} GOAT`}
                <br />
                <br />
                {`Claimed Balance: ${utils.formatEther(claimedBalance)} GOAT`}
                <br />
                <br />
                {`Unclaimed Balance: ${(beneficaryTotalBalance - claimedBalance) / 10 ** 18} GOAT`}
                <br />
                <br />
                {`Claimable Balance: ${utils.formatEther(availableBalance)} GOAT`}
                <br />
                <br />
                {`Locked Balance: ${utils.formatEther(lockedAmount)} GOAT`}
                <br />
                <br />
                {`Next Installment/Vesting Date: ${new Date(Date.now() + (nextPeriodDate || 0) * 1000).toDateString()}`}

                <br />
              </div>
              <button className={styles.button1} onClick={_claimToken}>
                Claim
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setBuyAmount(e.target.value || "");
              await _getAmountOfGOATTokensReceived(e.target.value || "0");
            }}
            className={styles.input}
            value={buyAmount}
          />
          <br />
          <div className={styles.inputDiv}>
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {`1GOAT = ${(1 / (utils.formatEther(tokenPriceRate) * 10 ** 6)).toFixed(3)}USDT`}
            <br />
            {`1USDT = ${(utils.formatEther(tokenPriceRate) * 10 ** 6)}GOAT`}

            <br />
            {`Your USDT Balance = ${usdtTokenBalance / 10 ** 6}USDT`}
            <br />
            <br />
            {`Min Purchase Limit: ${minPurchase / 10 ** 6}USDT`}
            <br />

            {`Max Purchase Limit: ${maxPurchase / 10 ** 6}USDT`}
            <br />
            <br />
            {`You have: ${utils.formatEther(beneficaryTotalBalance)} GOAT`}
            <br />
            <br />
            {`You will get: ${goatTokenToBeReceived} GOAT Token `}
            <br />
            <br />
            {`VESTING SCHEDULE => TGE:%${vestingScheduleMap[0]} Cliff:${vestingScheduleMap[1] / 86400}(Day) Period:${vestingScheduleMap[2] / 86400}(Day) Installments:${vestingScheduleMap[3]} `}
            <br />
            <br />
            {`Sold/Max Sale: ${utils.formatEther(tokenSold)}/${(maxSaleLimit / 10**18)} GOAT Token `}
          </div>
          <button className={styles.button1} onClick={_buyTokens}>
            Buy
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>GOAT Finance</title>
        <meta name="description" content="GOAT Project" />
        <link rel="icon" href="" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>GOAT FINANCE</h1>
          <div className={styles.description}>
            Vesting & ICO test
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setVestingTab(true);
              }}
            >
              Vesting
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setVestingTab(false);
              }}
            >
              ICO
            </button>
          </div>
          {renderButton()}
        </div>
      </div>
    </div>
  );
}
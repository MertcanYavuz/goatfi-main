import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  USDT_TOKEN_CONTRACT_ABI,
  USDT_TOKEN_CONTRACT_ADDRESS,
} from "../../constants";

export const buyToken = async (
  signer,
  usdtAmount,
  usdtAllowance
) => {
  try {
    const USDTTokenContract = new Contract(
      USDT_TOKEN_CONTRACT_ADDRESS,
      USDT_TOKEN_CONTRACT_ABI,
      signer
    );

    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );

    let tx;
    if (usdtAllowance < usdtAmount) {
      tx = await USDTTokenContract.approve(
        EXCHANGE_CONTRACT_ADDRESS,
        usdtAmount.toString()
      );
      await tx.wait();
    }

    tx = await exchangeContract.buyToken(usdtAmount);
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};
import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
} from "../../constants";

export const claimToken = async (
  signer
) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );

    let tx = await exchangeContract.claimVestedTokens();
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};
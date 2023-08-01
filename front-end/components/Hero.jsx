import React from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { abi } from "@/constants";
import { ethers } from "ethers";

const Hero = () => {
  const { chainId: HexchainId, isWeb3Enabled } = useMoralis();
  const [entranceFee, setEntranceFee] = useState(0);
  const chainId = parseInt(HexchainId);

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // specify the networkId
    functionName: "getEntranceFee",
    params: {},
  });

  useEffect(() => {
    const asyncGetEntranceFee = async () => {
      const result = await getEntranceFee();
      setEntranceFee(result);
    };
    asyncGetEntranceFee();
  }, [isWeb3Enabled]);

  return (
    <section className="px-16 py-6">
      <div id="info" className="font-mono">
        <h4 className="text-black font-semibold text-xl">
          Entrance Fee:{" "}
          <span className="font-normal text-blue-700">
            {entranceFee && ethers.formatEther(entranceFee.toString())}
            <span className="font-semibold">Eth</span>
          </span>
        </h4>
        <h4 className="text-black font-semibold text-xl">
          Number of Players:
        </h4>
      </div>
    </section>
  );
};

export default Hero;

import React from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { abi, contractAddresses } from "@/constants";
import { ethers } from "ethers";
import { useNotification } from "web3uikit";

const Hero = () => {
  const [entranceFee, setEntranceFee] = useState(0);
  const [numberOfPlayers, setNumberOfPlayers] = useState(0);
  const [recentWinner, setRecentWinner] = useState("");

  const dispatch = useNotification();
  const { chainId: HexchainId, isWeb3Enabled } = useMoralis();
  const chainId = parseInt(HexchainId);
  const raffleAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress, // specify the networkId
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress, // specify the networkId
    functionName: "getNumberOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress, // specify the networkId
    functionName: "getRecentWinner",
    params: {},
  });

  const {
    runContractFunction: enterRaffle,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress, // specify the networkId
    functionName: "enterRaffle",
    params: {},
    msgValue: entranceFee,
  });

  useEffect(() => {
    if (raffleAddress) {
      updateUI();
    }
  }, [isWeb3Enabled]);

  const asyncGetNumberOfPlayers = async () => {
    const result = await getNumberOfPlayers();
    setNumberOfPlayers(result);
  };

  const asyncGetEntranceFee = async () => {
    const result = await getEntranceFee();
    setEntranceFee(result);
  };

  const asyncGetRecentWinner = async () => {
    const result = await getRecentWinner();
    setRecentWinner(result);
  };

  const updateUI = () => {
    asyncGetNumberOfPlayers();
    asyncGetEntranceFee();
    asyncGetRecentWinner();
  };

  const handleSuccess = async (tx) => {
    try {
      await tx.wait();
      handleNewNotification(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const handleNewNotification = () => {
    dispatch({
      type: "success",
      message: "Transaction Complete!",
      title: "Transaction Notification",
      position: "topR",
    });
    updateUI();
  };

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
          Number of Players:{" "}
          <span className="font-normal text-blue-700">
            {numberOfPlayers?.toString()}
          </span>
        </h4>
        <h4 className="text-black font-semibold text-xl">
          Recent Winner:{" "}
          <span className="font-normal text-blue-700">
            {Number(recentWinner) !== 0 ? (
              recentWinner?.toString()
            ) : (
              <span>No recent winner</span>
            )}
          </span>
        </h4>
      </div>
      <div className="mt-[60px]">
        <button
          className="py-2 px-4 text-white font-semibold bg-blue-700
        rounded-md shadow-md"
          onClick={async () => {
            console.log("button clicked");
            await enterRaffle({
              onSuccess: handleSuccess,
              onError: (error) => {
                console.log(error);
              },
            });
          }}
          disabled={isLoading || isFetching}
        >
          Enter Raffle
        </button>
      </div>
    </section>
  );
};

export default Hero;

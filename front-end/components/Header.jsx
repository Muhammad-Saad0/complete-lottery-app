import React from "react";
import { ConnectButton } from "web3uikit";

const Header = () => {
  return (
    <section
      className="flex felx-row justify-between p-10 items-center h-[65px]
    shadow-md bg-gray-300"
    >
      <h1 className="font-semibold text-2xl text-black">
        Decentralized lottery
      </h1>
      <ConnectButton moralisAuth={false} />
    </section>
  );
};

export default Header;

const { ethers } = require("hardhat")
const {
    FRONTEND_CONTRACT_ADDRESSES_FILE,
    FRONTEND_ABI_FILE,
} = require("../helper-hardhat-config")
const fs = require("fs")

module.exports = async () => {
    const Raffle = await ethers.getContract("Raffle")

    const raffleAbi = Raffle.interface.formatJson()
    fs.writeFileSync(FRONTEND_ABI_FILE, raffleAbi)
}

module.exports.tags = ["all", "front-end"]

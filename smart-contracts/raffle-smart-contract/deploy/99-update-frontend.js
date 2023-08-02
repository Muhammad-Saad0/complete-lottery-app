const { ethers, network } = require("hardhat")
const {
    FRONTEND_CONTRACT_ADDRESSES_FILE,
    FRONTEND_ABI_FILE,
} = require("../helper-hardhat-config")
const fs = require("fs")
const chainId = network.config.chainId

module.exports = async () => {
    const Raffle = await ethers.getContract("Raffle")

    const RaffleAbi = Raffle.interface.formatJson()
    fs.writeFileSync(FRONTEND_ABI_FILE, RaffleAbi)

    const contractAddressesData = fs.readFileSync(
        FRONTEND_CONTRACT_ADDRESSES_FILE,
        "utf8"
    )

    const contractAddresses = JSON.parse(contractAddressesData)
    const contractAddress = await Raffle.getAddress()
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId].includes(contractAddress)) {
            contractAddresses[chainId].push(contractAddress)
        }
    } else {
        contractAddresses[chainId] = [contractAddress]
    }
    fs.writeFileSync(
        FRONTEND_CONTRACT_ADDRESSES_FILE,
        JSON.stringify(contractAddresses)
    )

    console.log(contractAddressesData)
}

module.exports.tags = ["all", "front-end"]

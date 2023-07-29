const { ethers } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    const enteranceFee = ethers.utils.parseEther("0.1")
    const args = [enteranceFee]
    const Raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
    })
}

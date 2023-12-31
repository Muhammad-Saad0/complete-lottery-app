const { ethers, network } = require("hardhat")
const {} = require("ethers")
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config")
const SUBSCRIPTION_FUND_AMOUNT = ethers.parseEther("2")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const chainID = network.config.chainId

    const gasLane = networkConfig[chainID]["keyHash"]
    const callBackGasLimit = networkConfig[chainID]["callBackGasLimit"]
    let subId, VRFCoordinatorMock, VRFCoordinatorMockAddress

    if (developmentChains.includes(network.name)) {
        VRFCoordinatorMock = await ethers.getContract(
            "VRFCoordinatorV2Mock",
            deployer
        )
        let tx = await VRFCoordinatorMock.createSubscription()
        await tx.wait(1)
        const events = await VRFCoordinatorMock.queryFilter(
            "SubscriptionCreated"
        )
        subId = events[0].args[0]
        tx = await VRFCoordinatorMock.fundSubscription(
            subId,
            SUBSCRIPTION_FUND_AMOUNT
        )
        console.log("\ncreated and funded subscription.")
        VRFCoordinatorMockAddress = await VRFCoordinatorMock.getAddress()
    }

    const interval = networkConfig[chainID]["automationUpdateInterval"]
    const enteranceFee = ethers.parseEther("0.1")
    const args = [
        enteranceFee,
        VRFCoordinatorMockAddress,
        subId,
        gasLane,
        callBackGasLimit,
        interval
    ]
    console.log("\ndeploying Raffle contract...")
    const Raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    console.log("Raffle contract deployed.")
    const raffleAddress = await Raffle.address
    tx = await VRFCoordinatorMock.addConsumer(subId, raffleAddress)
    console.log(
        "Raffle contract added as consumer.\n----------------------"
    )
}

module.exports.tags = ["all", "raffle"]

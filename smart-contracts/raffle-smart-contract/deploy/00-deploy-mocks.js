module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    const BASE_FEE = ethers.parseEther("0.25")
    const GAS_PRICE_LINK = 1e9

    console.log("\ndeploying mocks...")
    const args = [BASE_FEE, GAS_PRICE_LINK]
    await deploy("VRFCoordinatorV2Mock", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1,
    })
    console.log("Mocks deployed...")
}

module.exports.tags = ["all", "mocks"]

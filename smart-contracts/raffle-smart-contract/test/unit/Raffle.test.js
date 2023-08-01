const { assert, expect } = require("chai")
const {
    ethers,
    getNamedAccounts,
    deployments,
    network,
} = require("hardhat")
const { networkConfig } = require("../../helper-hardhat-config")

const ENTRANCE_FEE = ethers.parseEther("0.1")
const chainID = network.config.chainId
const INTERVAL = networkConfig[chainID]["automationUpdateInterval"]

const forwardTime = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let currentTimestamp = (await ethers.provider.getBlock())
                .timestamp
            const nextBlockTimeStamp =
                currentTimestamp + Number(INTERVAL) + 1
            await ethers.provider.send("evm_setNextBlockTimestamp", [
                nextBlockTimeStamp,
            ])
            //moving to the new block to get the updated timestamp
            await ethers.provider.send("evm_mine")
            resolve()
        } catch (error) {
            reject()
        }
    })
}

describe("Raffle unit testing", () => {
    describe("Testing enterRaffle function", () => {
        let Raffle, deployer, VRFCoordinatorMock
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])

            Raffle = await ethers.getContract("Raffle", deployer)
            VRFCoordinatorMock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            )
        })

        it('should revert with "Raffle__NotEnoughEth" when calling enterRaffle()', async () => {
            try {
                await Raffle.enterRaffle()
                // If the contract call does not revert, the test should fail
                assert.fail(
                    "Expected the function to revert but it did not"
                )
            } catch (error) {
                // Check if the error message matches the expected one
                expect(error.message).to.include("Raffle__NotEnoughEth")
            }
        })

        it("should push the sender to the array", async () => {
            const tx = await Raffle.enterRaffle({ value: ENTRANCE_FEE })
            await tx.wait(1)
            const player = await Raffle.getPlayer(0)
            expect(player).to.equal(deployer)
        })

        it("checks if the event was emitted with the right value", async () => {
            const tx = await Raffle.enterRaffle({ value: ENTRANCE_FEE })
            await tx.wait(1)

            const events = await Raffle.queryFilter("RaffleEntered")
            const playerFromEvent = events[0].args.player
            expect(playerFromEvent).to.be.equal(deployer)
        })

        describe("checking fulfillRandomWords", () => {
            let requestId
            beforeEach(async () => {
                let tx = await Raffle.enterRaffle({
                    value: ENTRANCE_FEE,
                })
                await tx.wait(1)
                await new Promise(async (resolve, reject) => {
                    VRFCoordinatorMock.once(
                        "RandomWordsRequested",
                        async () => {
                            try {
                                const events =
                                    await VRFCoordinatorMock.queryFilter(
                                        "RandomWordsRequested"
                                    )
                                requestId = events[0].args[1]
                                resolve()
                            } catch (error) {
                                reject()
                            }
                        }
                    )
                    await forwardTime()
                    tx = await Raffle.performUpkeep("0x")
                    await tx.wait(1)
                })
            })

            it("checks if the winner was picked", async () => {
                const RaffleAddress = await Raffle.getAddress()
                tx = await VRFCoordinatorMock.fulfillRandomWords(
                    requestId,
                    RaffleAddress
                )
                await tx.wait(1)

                const recentWinner = await Raffle.getRecentWinner()
                expect(recentWinner).to.be.equal(deployer)
            })

            it("checks if the winner event was emitted", async () => {
                const RaffleAddress = await Raffle.getAddress()
                tx = await VRFCoordinatorMock.fulfillRandomWords(
                    requestId,
                    RaffleAddress
                )
                await tx.wait(1)

                const events = await Raffle.queryFilter("WinnerPicked")
                const winner = events[0].args[0]
                expect(winner).to.equal(deployer)
            })
        })

        describe("Testing CheckUpKeep", () => {
            it("returns false if there are no players", async () => {
                await forwardTime()
                const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
                expect(upkeepNeeded).to.equal(false)
            })

            it("returns false if not enough time has passed", async () => {
                const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
                expect(upkeepNeeded).to.equal(false)
            })

            it("returns false if state is not open", async () => {
                let tx = await Raffle.enterRaffle({
                    value: ENTRANCE_FEE,
                })
                await forwardTime()
                //setting the state to calculating by calling performupkeep
                tx = await Raffle.performUpkeep("0x")
                await tx.wait(1)
                const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
                expect(upkeepNeeded).to.equal(false)
            })

            it("returns true if all the conditions are fulfilled", async () => {
                const tx = await Raffle.enterRaffle({
                    value: ENTRANCE_FEE,
                })
                await tx.wait(1)
                await forwardTime()
                const { upkeepNeeded } = await Raffle.checkUpkeep("0x")
                expect(upkeepNeeded).to.equal(true)
            })
        })

        describe("Testing performUpKeep", () => {
            it("reverts if not upkeep is not needed", async () => {
                try {
                    await Raffle.performUpkeep("0x")
                    // If the contract call does not revert, the test should fail
                    assert.fail(
                        "Expected the function to revert but it did not"
                    )
                } catch (error) {
                    // Check if the error message matches the expected one
                    expect(error.message).to.include(
                        "Raffle__UpKeepNotNeeded"
                    )
                }
            })

            it("sets the state to calculating", async () => {
                const tx = await Raffle.enterRaffle({
                    value: ENTRANCE_FEE,
                })
                await tx.wait(1)
                await forwardTime()

                await Raffle.performUpkeep("0x")
                expect(
                    (await Raffle.getRaffleState()).toString()
                ).to.equal("1")
            })

            it("emits an request random woeds event", async () => {
                await new Promise(async (resolve, reject) => {
                    VRFCoordinatorMock.once(
                        "RandomWordsRequested",
                        async () => {
                            console.log(
                                "EVENT FIRED: random words event fired!"
                            )
                            resolve()
                        }
                    )
                    let tx = await Raffle.enterRaffle({
                        value: ENTRANCE_FEE,
                    })
                    await tx.wait(1)
                    await forwardTime()

                    tx = await Raffle.performUpkeep("0x")
                    await tx.wait(1)
                })
            })
        })
    })
})

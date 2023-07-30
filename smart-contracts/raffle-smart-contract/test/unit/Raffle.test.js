const { assert, expect } = require("chai")
const { ethers, getNamedAccounts, deployments } = require("hardhat")

const ENTRANCE_FEE = ethers.parseEther("0.1")

describe("Raffle unit testing", () => {
    describe("Testing enterRaffle function", () => {
        let Raffle, deployer
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])

            Raffle = await ethers.getContract("Raffle", deployer)
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
    })
})

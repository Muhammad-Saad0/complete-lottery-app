// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    //types
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    //state variables
    uint256 private immutable entranceFee;
    address payable[] public players;
    VRFCoordinatorV2Interface private immutable COORDINATOR;
    uint64 private immutable subscriptionId;
    bytes32 private immutable gasLane;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint32 private immutable callBackGasLimit;
    RaffleState private raffleState;
    address private recentWinner;
    uint256 private lastTimeStamp;
    uint256 private immutable interval;

    //errors
    error Raffle__NotEnoughEth();
    error Raffle__TransferFailed();
    error Raffle__UpKeepNotNeeded();

    //events
    event RaffleEntered(address indexed player);
    event WinnerPicked(address winner);

    constructor(
        uint256 _entranceFee,
        address _VRFCoordinatorAddress,
        uint64 _subscriptionId,
        bytes32 _gasLane,
        uint32 _callBackGasLimit,
        uint256 _interval
    ) VRFConsumerBaseV2(_VRFCoordinatorAddress) {
        entranceFee = _entranceFee;
        COORDINATOR = VRFCoordinatorV2Interface(_VRFCoordinatorAddress);
        subscriptionId = _subscriptionId;
        gasLane = _gasLane;
        callBackGasLimit = _callBackGasLimit;
        lastTimeStamp = block.timestamp;
        interval = _interval;
    }

    function enterRaffle() public payable {
        if (msg.value != entranceFee) {
            revert Raffle__NotEnoughEth();
        }
        players.push(payable(msg.sender));
        emit RaffleEntered(msg.sender);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool stateCheck = (raffleState == RaffleState.OPEN);
        bool intervalCheck = (block.timestamp - lastTimeStamp) > interval;
        bool checkPlayers = (players.length > 0);
        bool checkBalance = (address(this).balance > 0);
        upkeepNeeded = (stateCheck &&
            intervalCheck &&
            checkPlayers &&
            checkBalance);
        return (upkeepNeeded, "");
        // We don't use the checkData in this example. The checkData is defined when the Upkeep was registered.
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpKeepNotNeeded();
        }
        // Will revert if subscription is not set and funded.
        COORDINATOR.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callBackGasLimit,
            NUM_WORDS
        );
        raffleState = RaffleState.CALCULATING;
    }

    function fulfillRandomWords(
        uint256 /*_requestId*/,
        uint256[] memory _randomWords
    ) internal override {
        uint256 indexOfWinner = _randomWords[0] % players.length;
        address payable selectedPlayer = players[indexOfWinner];
        recentWinner = selectedPlayer;
        lastTimeStamp = block.timestamp;
        raffleState = RaffleState.OPEN;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(selectedPlayer);
    }

    //getters
    function getEntranceFee() public view returns (uint256) {
        return entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return players[index];
    }

    function getRaffleState() public view returns (RaffleState) {
        return raffleState;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return lastTimeStamp;
    }

    function getRecentWinner() public view returns (address) {
        return recentWinner;
    }

    function getInterval() public view returns (uint256) {
        return interval;
    }

    // * receive function
    receive() external payable {}

    // * fallback function
    fallback() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract Raffle is VRFConsumerBaseV2 {
    //STATE VARIABLES
    uint256 private immutable entranceFee;
    address payable[] public players;
    VRFCoordinatorV2Interface private immutable COORDINATOR;
    uint64 private immutable subscriptionId;
    bytes32 private immutable gasLane;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint32 private immutable callBackGasLimit;

    //ERRORS
    error Raffle__NotEnoughEth();

    //events
    event RaffleEntered(address indexed player);
    event RequestFulfilled();
    event RandomWordsRequested();

    constructor(
        uint256 _entranceFee,
        address _VRFCoordinatorAddress,
        uint64 _subscriptionId,
        bytes32 _gasLane,
        uint32 _callBackGasLimit
    ) VRFConsumerBaseV2(_VRFCoordinatorAddress) {
        entranceFee = _entranceFee;
        COORDINATOR = VRFCoordinatorV2Interface(_VRFCoordinatorAddress);
        subscriptionId = _subscriptionId;
        gasLane = _gasLane;
        callBackGasLimit = _callBackGasLimit;
    }

    function enterRaffle() public payable {
        if (msg.value != entranceFee) {
            revert Raffle__NotEnoughEth();
        }
        players.push(payable(msg.sender));
        emit RaffleEntered(msg.sender);
    }

    function requestRandomWords() external returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callBackGasLimit,
            NUM_WORDS
        );

        emit RandomWordsRequested();
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        emit RequestFulfilled();
    }

    //getters
    function getPlayer(uint256 index) public view returns (address) {
        return players[index];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Raffle {
    //STATE VARIABLES
    uint256 entranceFee;

    //ERRORS
    error Raflle__NotEnoughEth();

    constructor(uint256 _entranceFee) {
        entranceFee = _entranceFee;
    }

    function enterRaffle() public payable {
        if (msg.value != entranceFee) {
            revert Raflle__NotEnoughEth();
        }
    }
}

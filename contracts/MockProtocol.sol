
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockProtocol is Ownable {
    uint256 public fee = 3;

    event FeeUpdated(uint256 oldFee, uint256 newFee);

    constructor() Ownable(msg.sender) {}

    function setFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = fee;
        fee = newFee;

        emit FeeUpdated(oldFee, newFee);
    }
}

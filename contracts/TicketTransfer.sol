// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./TokenMaster.sol";
contract TicketTransfer {
    TokenMaster public tokenMaster;
    constructor(address _tokenMasterAddress) {
        tokenMaster = TokenMaster(_tokenMasterAddress);
    }
    function transferTicket(uint256 _occasionId, uint256 _seat, address _to) public {
// Ensure the sender owns the ticket
        require(tokenMaster.seatTaken(_occasionId, _seat) == msg.sender, "You do not own this ticket");
// Ensure the recipient does not already have a ticket for this occasion
        require(!tokenMaster.hasBought(_occasionId, _to), "Recipient already has a ticket for this occasion");
// Transfer the ticket
        tokenMaster.updateSeatOwner(_occasionId, _seat, _to);
    }
}
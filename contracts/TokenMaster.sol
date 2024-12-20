// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

//openzeppelin is the lib to use the NFT 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TokenMaster is ERC721 {
    address public owner;
    uint256 public totalOccasions;
    uint256 public totalSupply; //total number of NFTs that can be created
    struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
    }
    mapping(uint256 => Occasion) occasions;
    mapping(uint256 => mapping(address => bool)) public hasBought;
    mapping(uint256 => mapping(uint256 => address)) public seatTaken; 
    mapping(uint256 => mapping(uint256 => uint256)) public seatToToken; // Mapping of seat number to token ID

    mapping(uint256 => uint256[]) seatsTaken; //array of seats taken
// evaluate person calling the function is the owner
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        owner = msg.sender;
    }
// write into bloackchain
    function list(
        string memory _name,
        uint256 _cost,
        uint256 _maxTickets,
        string memory _date,
        string memory _time,
        string memory _location
    ) public onlyOwner {
        totalOccasions++;
        occasions[totalOccasions] = Occasion(
            totalOccasions,
            _name,
            _cost,
            _maxTickets,
            _maxTickets,
            _date,
            _time,
            _location
        );
    }

//call the function and at the same time pay the developer
    function mint(uint256 _id, uint256 _seat) public payable {
        // Require that _id is not 0 or less than total occasions...
        require(_id != 0);
        require(_id <= totalOccasions);
        // Require that ETH sent is greater than cost...
        require(msg.value >= occasions[_id].cost);
        // Require that the seat is not taken, and the seat exists...
        require(seatTaken[_id][_seat] == address(0));
        require(_seat <= occasions[_id].maxTickets);
        occasions[_id].tickets -= 1; // <-- Update ticket count
        hasBought[_id][msg.sender] = true; // <-- Update buying status
        seatTaken[_id][_seat] = msg.sender; // <-- Assign seat
        seatsTaken[_id].push(_seat); // <-- Update seats currently taken
        totalSupply++;
        seatToToken[_id][_seat] = totalSupply;
        _safeMint(msg.sender, totalSupply); //check if the user has bought
    }
// read the occasion from the bloackchain
    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        return occasions[_id];
    }
    function getSeatsTaken(uint256 _id) public view returns (uint256[] memory) {
        return seatsTaken[_id];
    }

     // Resell a ticket
function resellTicket(uint256 _id, uint256 _seat, address _to) public {
    require(seatTaken[_id][_seat] == msg.sender, "You do not own this ticket");
    require(_to != address(0), "Invalid buyer address");
    require(!hasBought[_id][_to], "Buyer has already bought a ticket for this occasion");
    // Get the token ID
    uint256 tokenId = seatToToken[_id][_seat];
    require(_exists(tokenId), "Token does not exist");
    // Update seat ownership
    seatTaken[_id][_seat] = _to;
    hasBought[_id][msg.sender] = false;
    hasBought[_id][_to] = true;
    // Transfer the NFT
    _safeTransfer(msg.sender, _to, tokenId, "");
}

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}

const { expect } = require("chai")

const NAME = "TokenMaster"
const SYMBOL = "TM"

const OCCASION_NAME = "ETH Texas"
const OCCASION_COST = ethers.utils.parseUnits('1', 'ether')
const OCCASION_MAX_TICKETS = 100
const OCCASION_DATE = "Apr 27"
const OCCASION_TIME = "10:00AM CST"
const OCCASION_LOCATION = "Austin, Texas"

describe("TokenMaster", () => {
  let tokenMaster
  let deployer, buyer

  beforeEach(async () => {
    // Setup accounts
    [deployer, buyer] = await ethers.getSigners()

    // Deploy contract
    const TokenMaster = await ethers.getContractFactory("TokenMaster")
    tokenMaster = await TokenMaster.deploy(NAME, SYMBOL)

    const transaction = await tokenMaster.connect(deployer).list(
      OCCASION_NAME,
      OCCASION_COST,
      OCCASION_MAX_TICKETS,
      OCCASION_DATE,
      OCCASION_TIME,
      OCCASION_LOCATION
    )

    await transaction.wait()
  })

  describe("Deployment", () => {
    it("Sets the name", async () => {
      expect(await tokenMaster.name()).to.equal(NAME)
    })

    it("Sets the symbol", async () => {
      expect(await tokenMaster.symbol()).to.equal(SYMBOL)
    })

    it("Sets the owner", async () => {
      expect(await tokenMaster.owner()).to.equal(deployer.address)
    })
  })

  describe("Occasions", () => {
    it('Returns occasions attributes', async () => {
      const occasion = await tokenMaster.getOccasion(1)
      expect(occasion.id).to.be.equal(1)
      expect(occasion.name).to.be.equal(OCCASION_NAME)
      expect(occasion.cost).to.be.equal(OCCASION_COST)
      expect(occasion.tickets).to.be.equal(OCCASION_MAX_TICKETS)
      expect(occasion.date).to.be.equal(OCCASION_DATE)
      expect(occasion.time).to.be.equal(OCCASION_TIME)
      expect(occasion.location).to.be.equal(OCCASION_LOCATION)
    })

    it('Updates occasions count', async () => {
      const totalOccasions = await tokenMaster.totalOccasions()
      expect(totalOccasions).to.be.equal(1)
    })
  })

  describe("Minting", () => {
    const ID = 1
    const SEAT = 50
    const AMOUNT = ethers.utils.parseUnits('1', 'ether')

    beforeEach(async () => {
      const transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, { value: AMOUNT })
      await transaction.wait()
    })

    it('Updates ticket count', async () => {
      const occasion = await tokenMaster.getOccasion(1)
      expect(occasion.tickets).to.be.equal(OCCASION_MAX_TICKETS - 1)
    })

    it('Updates buying status', async () => {
      const status = await tokenMaster.hasBought(ID, buyer.address)
      expect(status).to.be.equal(true)
    })

    it('Updates seat status', async () => {
      const owner = await tokenMaster.seatTaken(ID, SEAT)
      expect(owner).to.equal(buyer.address)
    })

    it('Updates overall seating status', async () => {
      const seats = await tokenMaster.getSeatsTaken(ID)
      expect(seats.length).to.equal(1)
      expect(seats[0]).to.equal(SEAT)
    })

    it('Updates the contract balance', async () => {
      const balance = await ethers.provider.getBalance(tokenMaster.address)
      expect(balance).to.be.equal(AMOUNT)
    })
  })

  describe("Withdrawing", () => {
    const ID = 1
    const SEAT = 50
    const AMOUNT = ethers.utils.parseUnits("1", 'ether')
    let balanceBefore

    beforeEach(async () => {
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      let transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, { value: AMOUNT })
      await transaction.wait()

      transaction = await tokenMaster.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const balance = await ethers.provider.getBalance(tokenMaster.address)
      expect(balance).to.equal(0)
    })
  })
  describe("Resale", () => {
    const ID = 1;
    const SEAT = 50;
    const AMOUNT = ethers.utils.parseUnits("1", "ether");
    let buyer2;
  
    beforeEach(async () => {
      [, , buyer2] = await ethers.getSigners();
  
      // Mint a ticket
      const transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, { value: AMOUNT });
      await transaction.wait();
  
      // Validate minting
      const owner = await tokenMaster.seatTaken(ID, SEAT);
      const tokenId = await tokenMaster.seatToToken(ID, SEAT);
      const tokenOwner = await tokenMaster.ownerOf(tokenId);
  
      expect(owner).to.equal(buyer.address);
      expect(tokenId).to.equal(1);
      expect(tokenOwner).to.equal(buyer.address);
    });
  
    it("Allows the original buyer to resell a ticket", async () => {
      // Resell the ticket
      const tokenId = await tokenMaster.seatToToken(ID, SEAT);
      expect(tokenId).to.equal(1); // Ensure token ID mapping is correct
  
      const transaction = await tokenMaster.connect(buyer).resellTicket(ID, SEAT, buyer2.address);
      await transaction.wait();
  
      // Check updated ownership
      const newOwner = await tokenMaster.seatTaken(ID, SEAT);
      const tokenOwner = await tokenMaster.ownerOf(tokenId);
  
      expect(newOwner).to.equal(buyer2.address);
      expect(tokenOwner).to.equal(buyer2.address);
  
      // Check buyer status
      const originalBuyerStatus = await tokenMaster.hasBought(ID, buyer.address);
      const newBuyerStatus = await tokenMaster.hasBought(ID, buyer2.address);
  
      expect(originalBuyerStatus).to.equal(false);
      expect(newBuyerStatus).to.equal(true);
    });
  
    it("Reverts if a non-owner tries to resell a ticket", async () => {
      await expect(
        tokenMaster.connect(buyer2).resellTicket(ID, SEAT, buyer2.address)
      ).to.be.revertedWith("You do not own this ticket");
    });
  
    it("Reverts if the buyer address is invalid", async () => {
      await expect(
        tokenMaster.connect(buyer).resellTicket(ID, SEAT, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid buyer address");
    });
  
    it("Reverts if the new buyer already owns a ticket for the occasion", async () => {
      // Mint another ticket for buyer2
      await tokenMaster.connect(buyer2).mint(ID, 51, { value: AMOUNT });
  
      await expect(
        tokenMaster.connect(buyer).resellTicket(ID, SEAT, buyer2.address)
      ).to.be.revertedWith("Buyer has already bought a ticket for this occasion");
    });
  });
  
 
})

const hre = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // Setup accounts & variables
  const [deployer] = await ethers.getSigners()
  const NAME = "TokenMaster"
  const SYMBOL = "TM"

  // Deploy contract
  const TokenMaster = await ethers.getContractFactory("TokenMaster")
  const tokenMaster = await TokenMaster.deploy(NAME, SYMBOL)
  await tokenMaster.deployed()

  console.log(`Deployed TokenMaster Contract at: ${tokenMaster.address}\n`)


  const TicketTransfer = await ethers.getContractFactory("TicketTransfer")
  const ticketTransfer = await TicketTransfer.deploy(tokenMaster.address)
  await ticketTransfer.deployed()
 
  console.log(`Deployed TicketTransfer Contract at: ${ticketTransfer.address}\n`)

  // List 6 events
  const occasions = [
    {
      name: "Coldplay - Music of the Spheres World Tour",
      cost: tokens(5),
      tickets: 0,
      date: "Jan 18 2025",
      time: "6:00PM IST",
      location: "DY Patil Stadium, Navi Mumbai"
    },
    {
      name: "Sunburn Goa 2024 music",
      cost: tokens(1),
      tickets: 150,
      date: "Dec 30 2024",
      time: "6:30PM IST",
      location: "Dhargalim in North Goa, India"
    },
    {
      name: "Lollapalooza India 2025",
      cost: tokens(0.25),
      tickets: 200,
      date: "Mar 09 2025",
      time: "6:30PM IST",
      location: "Mahalaxmi Race Course: Mumbai"
    },
    {
      name: "Shaan Live In Concert - Bengaluru",
      cost: tokens(3),
      tickets: 0,
      date: "Dec 20 2024",
      time: "7:30PM IST",
      location: "Phoenix Marketcity, Whitefield: Bengaluru"
    },
    {
      name: "Sirf SPB",
      cost: tokens(1.5),
      tickets: 125,
      date: "Jun 04 2025",
      time: "6:30PM IST",
      location: "Telugu Vignana Samithi: Bengaluru"
    }
  ]

  for (var i = 0; i < 5; i++) {
    const transaction = await tokenMaster.connect(deployer).list(
      occasions[i].name,
      occasions[i].cost,
      occasions[i].tickets,
      occasions[i].date,
      occasions[i].time,
      occasions[i].location,
    )

    await transaction.wait()

    console.log(`Listed Event ${i + 1}: ${occasions[i].name}`)
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
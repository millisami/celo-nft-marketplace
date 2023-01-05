require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config({path: ".env"})

const PRIVATE_KEY = process.env.PRIVATE_KEY
const RPC_URL = process.env.RPC_URL

module.exports = {
  solidity: "0.8.17",
  networks: {
    alfajores: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY]
    }
  }
}

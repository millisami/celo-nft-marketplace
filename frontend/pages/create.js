import { Contract } from "ethers"
import { isAddress, formatEther, parseEther } from "ethers/lib/utils"
import Link from 'next/link'
import { useState } from "react"
import { useSigner, erc721ABI } from "wagmi"
import MarketplaceABI from "../abis/NFTMarketplace.json"
import Navbar from "../components/Navbar"
import styles from "../styles/Create.module.css"
import { MARKETPLACE_ADDRESS } from "../constants"

export default function Create() {
  // State vars to contain the info about the NFT being sold
  const [nftAddress, setNftAddress] = useState("")
  const [tokenId, setTokenId] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [showListingLink, setShowListingLink] = useState(false)

  // Get signer from Wagmi
  const { data: signer } = useSigner()

  // Handles form submit
  async function handleCreateListing() {
    // Set loading to true
    setLoading(true)

    try {
      // make sure contract address is valid
      const isValidAddress = isAddress(nftAddress)
      if(!isAddress) {
        throw new Error('Invalid contract address')
      }

      // Request approval over NFT if required, then create listing
      await requestApproval()
      await createListing()

      // Start displaying a button to view the NFT details
      setShowListingLink(true)
    } catch (error) {
      console.error(error)
    }
  }

  // Function to check if NFT approval is required
  async function requestApproval() {
    // Get signer's address
    const address = await signer.getAddress()

    // Initialize a contract instance for the NFT contract
    const ERC721Contract = new Contract(nftAddress, erc721ABI, signer)
    
    //Make sure the user is owner of the NFT
    const tokenOwner = await ERC721Contract.ownerOf(tokenId)
    if (tokenOwner.toLowerCase() !== address.toLowerCase()) {
      throw new Error('You do not own this NFT')
    }

    // Check if user already gave approval to the marketplace
    const isApproved = await ERC721Contract.isApprovedForAll(address, MARKETPLACE_ADDRESS)

    // If not approved
    if(!isApproved) {
      console.log('Requesting approval for the NFTs...')

      // Send approval transaction to the NFT contract
      const approvalTxn = await ERC721Contract.setApprovalForAll(MARKETPLACE_ADDRESS, true)
      await approvalTxn.wait()
    }
  }

  // Function to call createListing in the marketplace contract
  async function createListing() {
    // Initialize an instance of the marketplace contract
    const MarketplaceContract = new Contract(MARKETPLACE_ADDRESS, MarketplaceABI, signer)
    
    // Send the createListing transaction
    const createListingTxn = await MarketplaceContract.createListing(
      nftAddress,
      tokenId,
      parseEther(price)
    )
    await createListingTxn.wait()
  }

  return (
    <>
      <Navbar />
      {/* Show the input fields */}
      <div className={styles.container}>
        <input 
          type='text'
          placeholder="NFT Address 0x..."
          value={nftAddress}
          onChange={(e) => setNftAddress(e.target.value)}
        />
        <input 
          type='text'
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <input 
          type='text'
          placeholder="Price (CELO)"
          value={price}
          onChange={(e) => {
              if(e.target.value === "") { setPrice("0") }
              else { setPrice(e.target.value) }
            }
          }
        />
        {/* Button to create the listing */}
        <button onClick={handleCreateListing} disabled={loading}>
          {loading ? 'Loading...' : 'Create'}
        </button>

        {/* Button to take user to the NFT details page after listing is created */}
        {showListingLink && (
          <Link href={`/${nftAddress}/${tokenId}`}>
            
              <button>View Listing</button>
            
          </Link>
        )}
      </div>
    </>
  )
}
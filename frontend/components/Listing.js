import { useEffect, useState } from 'react'
import { useAccount, useContract, useProvider, erc721ABI } from 'wagmi'
import styles from '../styles/Listing.module.css'
import { formatEther } from 'ethers/lib/utils'

export default function Listing(props) {
  // State vars to hold NFT information
  const [imageURI, setImageURI] = useState("")
  const [name, setName] = useState("")

  // Loading state
  const [loading, setLoading] = useState(true)

  // Get the provider, connected address and a contract instance for the NFT contract using wagmi
  const provider = useProvider()
  const { address } = useAccount()
  const ERC721Contract = useContract({
    address: props.nftAddress,
    abi: erc721ABI,
    signerOrProvider: provider
  })
  
  // Check if the NFT seller is the connected user
  const isOwner = address.toLowerCase() === props.seller.toLowerCase()

  // Fetch NFT details by resolving the token URI
  async function fetchNFTDetails() {
    try {
      // Get token URI from contract
      
      let tokenURI = await ERC721Contract.tokenURI(0)
      
      // If its an ipfs URI, replace with http gateway
      tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
      
      // Resolve the tokenURI
      const metadata = await fetch(tokenURI)
      const metadataJSON = await metadata.json()
      console.log(metadataJSON)
      // Extract image URI from metadata
      let image = metadataJSON.imageUrl
      // If its an ipfs URI, replace with https gateway
      image = image.replace('ipfs://', 'https://ipfs.io/ipfs/')

      // Update state vars
      setImageURI(image)
      setName(metadataJSON.name)
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  // Fetch NFT deatils when component is loaded
  useEffect(() => {
    fetchNFTDetails()
  }, [])
  
  return (
    <div>
      {loading ? (
        <span>Loading...</span>
      ) : (
        <div className={styles.card}>
          <img src={imageURI} />
          <div className={styles.container}>
            <span><strong>{name} - #{props.tokenId}</strong></span>
            <span>Price: {formatEther(props.price)} CELO</span>
            <span>Seller: {isOwner ? "You" : props.seller.substring(0, 6) + "..."}</span>
          </div>
        </div>
      )}
    </div>
  )
}

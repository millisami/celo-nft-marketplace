import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import Listing from "../components/Listing"

import { createClient } from "urql"
import styles from "../styles/Home.module.css"
import Link from 'next/link'
import { SUBGRAPH_URL } from '../constants'
import { useAccount } from "wagmi"

const Home = () => {
  // State vars to contain active listings and signify a loading state
  const [loading, setLoading] = useState(false)
  const [listings, setListings] = useState()
  const { isConnected } = useAccount()

  // Function to fetch listings from Subgraph
  const fetchListings = async () => {
    setLoading(true)
    // The GraphQL query to run
    const listingsQuery = `
      query ListingsQuery {
        listingEntities {
          id
          nftAddress
          tokenId
          price
          seller
          buyer
        }
      }
    `
    // Create a urql client
    const urqlClient = createClient({ url: SUBGRAPH_URL })
    // Send the query to Subgraph GraphQL API and get response
    const response = await urqlClient.query(listingsQuery).toPromise()
    const listingEntities = response.data.listingEntities
    // Filter out active listings i.e. ones which haven't been sold
    const activeListings = listingEntities.filter((l) => l.buyer === null)
    // Update state vars
    setListings(activeListings)
    setLoading(false)
  }

  useEffect(() => {
    // Fetch listings on page load once wallet connection exists
    if(isConnected) {
      fetchListings()
    }
  }, [])

  return (
    <>
    <Navbar />
    {/* Show loading status if query hasn't responded yet */}
    {loading && isConnected && <span>Loading...</span>}

    {/* Render the listings */}
    <div className={styles.container}>
      {!loading && listings && listings.map((listing) => {
        return(
          <Link key={listing.id} href={`/${listing.nftAddress}/${listing.tokenId}`}>
            <Listing
              nftAddress={listing.nftAddress}
              tokenId={listing.tokenId}
              price={listing.price}
              seller={listing.seller}
            />
          </Link>
        )
      })}
    </div>
    {/* Show "No Listings" if query returned empty */}
    {!loading && listings && listings.length === 0 && (
        <span>No listings found.</span>
      )}
    </>
  )
}

export default Home
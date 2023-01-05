import {
  ListingCanceled,
  ListingCreated,
  ListingPurchased,
  ListingUpdated,
} from "../generated/NFTMarketplace/NFTMarketplace";

import { store } from "@graphprotocol/graph-ts";
import { ListingEntity } from "../generated/schema";

export function handleListingCreated(event: ListingCreated): void {
  // Create a unique ID for the listing
  const id = 
    event.params.nftAddress.toHex() + "_" +
    event.params.tokenId.toString() + "_" +
    event.params.seller.toHex()
  
  // Create a new entity and assign the ID
  let listing = new ListingEntity(id);

  // Set the properties of the listing as defined in the schema based on the event
  listing.seller = event.params.seller;
  listing.tokenId = event.params.tokenId;
  listing.nftAddress = event.params.nftAddress;
  listing.price = event.params.price;

  // Save the listing to the nodes, so we can query it later
  listing.save();
}

export function handleListingCanceled(event: ListingCanceled): void {
  const id = 
    event.params.nftAddress.toHex() + "_" +
    event.params.tokenId.toString() + "_" +
    event.params.seller.toHex()

  // Load the listing
  let listing = ListingEntity.load(id);
  if (listing) {
    // Remove it from store
    store.remove("ListingEntity", id);
  }
}

export function handleListingPurchased(event: ListingPurchased): void {
  const id = 
    event.params.nftAddress.toHex() + "_" +
    event.params.tokenId.toString() + "_" +
    event.params.seller.toHex()

  // Load the listing
  let listing = ListingEntity.load(id);

  if (listing) {
    // Set the buyer
    listing.buyer = event.params.buyer;

    // save
    listing.save();
  }
}

export function handleListingUpdated(event: ListingUpdated): void {
  // Recreate the ID that refers to the listing
  // Since the listing is being updated,
  // the datastore must already have an entity with this ID
  // from when the listing was first created
  const id = 
    event.params.nftAddress.toHex() + "_" +
    event.params.tokenId.toString() + "_" +
    event.params.seller.toHex()

  // Load the listing
  let listing = ListingEntity.load(id);

  if (listing) {
    // Update the price
    listing.price = event.params.newPrice;
    // Save
    listing.save();
  }
}
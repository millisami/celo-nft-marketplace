// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {
    
    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    // Requires msg.sender is the owner of the specified NFT
    modifier isNFTOwner(address nftAddress, uint256 tokenId) {
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "MRKT: Not the owner");
        _;
    }

    // Requires that the specified NFT is not already listed for sale
    modifier isNotListed(address nftAddress, uint256 tokenId) {
        require(listings[nftAddress][tokenId].price == 0, "MRKT: Already listed");
        _;
    }

    // Requires that the specified NFT is already listed for sale
    modifier isListed(address nftAddress, uint256 tokenId) {
        require(listings[nftAddress][tokenId].price > 0, "MRKT: Not listed");
        _;
    }

    event ListingCreated(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );

    function createListing(
            address nftAddress, 
            uint256 tokenId, 
            uint256 price
    )
        external 
        isNotListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
    {
        // Cannot create listing to sell NFT for less than 0 ETH
        require(price > 0, "MRKT: Price cannot be zero");

        IERC721 nftContract = IERC721(nftAddress);
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
            nftContract.getApproved(tokenId) == address(this), "MRKT: No approval for NFT"
        );

        // Add the listing to the mapping
        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });

        emit ListingCreated(nftAddress, tokenId, price, msg.sender);
    }
    
    event ListingCanceled(address nftAddress, uint256 tokenId, address seller);

    function cancelListing(address nftAddress, uint256 tokenId) 
        external
        isListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
    {
        // Delete the Listing from the mapping
        delete listings[nftAddress][tokenId];

        emit ListingCanceled(nftAddress, tokenId, msg.sender);
    }

    event ListingUpdated(address nftAddress, uint256 tokenId, uint256 newPrice, address seller);

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice)
        external
        isListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
    {
        // Cannot update the price < 0
        require(newPrice > 0, "MRKT: Price must be > 0");

        // Update the listings mapping
        listings[nftAddress][tokenId].price = newPrice;

        emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
    }

    event ListingPurchased(
        address nftAddress,
        uint256 tokenId,
        address seller,
        address buyer
    );

    function purchaseListing(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
    {
        // Load the listing in the local copy
        Listing memory listing = listings[nftAddress][tokenId];

        // Buyer must have sent enough ETH
        require(msg.value == listing.price, "MRKT: Incorrect ETH supplied");

        // Delete the listing
        delete listings[nftAddress][tokenId];

        // Transfer NFT from seller to buyer
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer ETH sent from buyer to seller
        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Failed to transfer ETH");

        emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
    }
}
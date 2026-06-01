"use server";

import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
});

export async function uploadToIPFS(file: File) {
    try {
        const ipfsUploadResponse = await pinata.upload.file(file);
        const ipfsUrl = `ipfs://${ipfsUploadResponse.IpfsHash}`;

        // "name": "Contract Asset",
        // "description": "Legally binding agreement asset",
        // "image": "ipfs://IMAGE_CID"
        return { success: true, ipfsUrl };
    } catch (error) {
        console.error("IPFS Upload Error:", error);
        return { success: false, error: "Failed to upload image to IPFS" };
    }
}
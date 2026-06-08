import mongoose from "mongoose";

async function main() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error(
            "Please define the MONGODB_URI environment variable inside .env.local",
        );
    }

    const opts = {
        bufferCommands: false,
        family: 4,
    };
    const conn = await mongoose
        .connect(MONGODB_URI!, opts)
        .then((mongooseInstance) => {
            return mongooseInstance;
        });

    conn.connection.db?.dropCollection("agreements");
    console.log("✅ Database cleared.");

    // const sample = [
    //     {
    //         _id: ObjectId('6a1850fe94b99475d12c8eb2'),
    //         clubUserId: ObjectId('6a1850fe94b99475d12c8eb1'), // Same clubUserId
    //         playerWalletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d14731',
    //         playerEmail: 'striker99@gmail.com',
    //         clubWalletAddress: '0x4963550b9ac760ce0b7e44242f986272016660dc',
    //         clubEmail: 'krustymcpe@gmail.com',
    //         attorneyWalletAddress: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
    //         attorneyEmail: 'legal-agent1@lawfirm.com',
    //         title: 'Season Pro Contract - Junior Neo',
    //         description: 'Official standard player contract registration for the upcoming 2026/2027 regional championship.',
    //         tokenURI: 'ipfs://bafybeihgkrstymcpe7ocvcxonaz5dokcxttptz32lxjildvitu3yca5',
    //         cautionAmount: '2500000',
    //         playerSignature: '0x8b4a...3c2f', // Signed
    //         clubSignature: '0x3f1d...9a1b',   // Signed
    //         attorneySignature: null,          // Waiting on attorney
    //         status: 'pending_signatures',
    //         mintTxHash: null,
    //         nftTokenId: null,
    //         vaultAddress: null,
    //         nonce: 1,
    //         deadline: ISODate('2026-06-15T12:00:00.000Z'),
    //         createdAt: ISODate('2026-06-02T09:00:00.000Z'),
    //         updatedAt: ISODate('2026-06-02T10:15:30.000Z'),
    //         __v: 0
    //     },
    //     {
    //         _id: ObjectId('6a1850fe94b99475d12c8eb3'),
    //         clubUserId: ObjectId('6a1850fe94b99475d12c8eb1'), // Same clubUserId
    //         playerWalletAddress: '0xFAb716b801D385012588BA3932Ffa5CCdf79B572',
    //         playerEmail: 'midfield_anchor@yahoo.com',
    //         clubWalletAddress: '0x4963550b9ac760ce0b7e44242f986272016660dc',
    //         clubEmail: 'krustymcpe@gmail.com',
    //         attorneyWalletAddress: '0x0000000000000000000000000000000000000009',
    //         attorneyEmail: 'ipooo346@gmail.com',
    //         title: 'Loan Agreement Extension',
    //         description: 'Temporary loan structural terms adjustments regarding the fallback vault allocation stipulations.',
    //         tokenURI: 'ipfs://bafybeifk72z27ocvcxonaz5dokcxttptz32lxjildvitu3yca6',
    //         cautionAmount: '500000',
    //         playerSignature: '0x4c2a...7e12',
    //         clubSignature: '0x3f1d...9a1b',
    //         attorneySignature: '0x1a8f...6b4c', // Fully signed!
    //         status: 'minting',                  // Status moved to minting
    //         mintTxHash: '0x94b3c75402bd0ea51759debbba1b01777d130c253683070b4f849cf1a156eef4',
    //         nftTokenId: null,
    //         vaultAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    //         nonce: 2,
    //         deadline: ISODate('2026-06-05T18:30:00.000Z'),
    //         createdAt: ISODate('2026-05-28T14:22:11.000Z'),
    //         updatedAt: ISODate('2026-06-02T08:11:44.000Z'),
    //         __v: 1
    //     },
    //     {
    //         _id: ObjectId('6a1850fe94b99475d12c8eb4'),
    //         clubUserId: ObjectId('6a1850fe94b99475d12c8eb1'), // Same clubUserId
    //         playerWalletAddress: '0x228189D22756db6cEF95fC29599bAA7C9a6FA01B',
    //         playerEmail: 'gk_glovemaster@hotmail.com',
    //         clubWalletAddress: '0x4963550b9ac760ce0b7e44242f986272016660dc',
    //         clubEmail: 'krustymcpe@gmail.com',
    //         attorneyWalletAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    //         attorneyEmail: 'sports_mediator@gmlaw.com',
    //         title: 'Image Rights Deal - ImageRights_V2',
    //         description: 'Commercial representation and metadata IPFS anchoring for Web3 sponsorship integration.',
    //         tokenURI: 'ipfs://bafybeih52putrcq27ocvcxonaz5dokcxttptz32lxjildvitu3yca7',
    //         cautionAmount: '8000000',
    //         playerSignature: '0x2d3f...8b9a',
    //         clubSignature: '0x3f1d...9a1b',
    //         attorneySignature: '0x7c4e...12fd',
    //         status: 'completed',                // Fully minted contract
    //         mintTxHash: '0xe2130c253683070b4f849cf1a156eef494b3c75402bd0ea51759debbba1b0177',
    //         nftTokenId: 42,
    //         vaultAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    //         nonce: 3,
    //         deadline: ISODate('2026-05-30T00:00:00.000Z'),
    //         createdAt: ISODate('2026-05-15T10:00:00.000Z'),
    //         updatedAt: ISODate('2026-05-20T16:45:12.000Z'),
    //         __v: 2
    //     },
    //     {
    //         _id: ObjectId('6a1850fe94b99475d12c8eb5'),
    //         clubUserId: ObjectId('6a1850fe94b99475d12c8eb1'), // Same clubUserId
    //         playerWalletAddress: '0x9965507B1a059579622c1d7001cd50B6577a3298',
    //         playerEmail: 'speedy_winger@outlook.com',
    //         clubWalletAddress: '0x4963550b9ac760ce0b7e44242f986272016660dc',
    //         clubEmail: 'krustymcpe@gmail.com',
    //         attorneyWalletAddress: '0x0000000000000000000000000000000000000009',
    //         attorneyEmail: 'ipooo346@gmail.com',
    //         title: 'Academy Draft Intent Letter',
    //         description: 'Initial intent protocol mapping for under-21 development program onboarding.',
    //         tokenURI: 'ipfs://bafybeidokcxttptz32lxjildvitu3yca4hnftf52putrcq27ocvcxonaz5',
    //         cautionAmount: '150000',
    //         playerSignature: null,
    //         clubSignature: null,
    //         attorneySignature: null,
    //         status: 'expired',                  // Missed the deadline
    //         mintTxHash: null,
    //         nftTokenId: null,
    //         vaultAddress: null,
    //         nonce: 0,
    //         deadline: ISODate('2026-05-01T12:00:00.000Z'),
    //         createdAt: ISODate('2026-04-15T08:30:00.000Z'),
    //         updatedAt: ISODate('2026-05-01T12:00:05.000Z'),
    //         __v: 0
    //     },
    //     {
    //         _id: ObjectId('6a1850fe94b99475d12c8eb6'),
    //         clubUserId: ObjectId('6a1850fe94b99475d12c8eb1'), // Same clubUserId
    //         playerWalletAddress: '0x1123581321345589144233377761011121314151',
    //         playerEmail: 'captain_veteran@gmail.com',
    //         clubWalletAddress: '0x4963550b9ac760ce0b7e44242f986272016660dc',
    //         clubEmail: 'krustymcpe@gmail.com',
    //         attorneyWalletAddress: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    //         attorneyEmail: 'sports_mediator@gmlaw.com',
    //         title: 'Performance Bonus Addendum',
    //         description: 'Performance tier trigger clauses adjusting the escrow release schedules upon hitting 15 club goals.',
    //         tokenURI: 'ipfs://bafybeilyca4hnftf52putrcq27ocvcxonaz5dokcxttptz32lxjildvitu3y',
    //         cautionAmount: '350000',
    //         playerSignature: null,
    //         clubSignature: '0x3f1d...9a1b',  // Only club has signed
    //         attorneySignature: null,
    //         status: 'pending_signatures',
    //         mintTxHash: null,
    //         nftTokenId: null,
    //         vaultAddress: null,
    //         nonce: 4,
    //         deadline: ISODate('2026-06-10T23:59:59.000Z'),
    //         createdAt: ISODate('2026-06-02T05:20:00.000Z'),
    //         updatedAt: ISODate('2026-06-02T05:25:00.000Z'),
    //         __v: 0
    //     }
    // ]

    conn.disconnect();
}

main()
    .catch((err) => {
        console.error("❌ Error seeding database:", err);
        process.exit(1);
    })
    .finally(async () => {
        console.log("🔌 Done executing seed script.");
    });

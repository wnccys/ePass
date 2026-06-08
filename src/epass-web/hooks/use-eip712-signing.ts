import { useState } from "react";
import { useSignTypedData } from "wagmi";
import { RIGHTS_MINTER } from "@/lib/web3/contracts";
import {
    buildMintAgreementDomain,
    MINT_AGREEMENT_TYPES,
} from "@/lib/web3/eip712";

type SignStatus = "idle" | "awaiting_wallet" | "success" | "error";

export function useEip712Signing(chainId: number) {
    const [status, setStatus] = useState<SignStatus>("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);

    const { mutateAsync } = useSignTypedData();

    /**
     * Create a signable payload / sign payload / manage hook status / return keccak-256 signature string
     * @param agreement
     * @returns
     */
    const signAgreement = async (agreement: any) => {
        try {
            setStatus("awaiting_wallet");
            setErrorMsg(null);
            setSignature(null);

            // We format the data to match the struct types exactly
            // Here is important to contextualize the what 'to sign' means.
            // This is the argument present on RightsMinter.sol, it contains and represents a contract
            // struct MintAgreement {
            //     address player;
            //     address club;
            //     address attorney;
            //     string tokenURI;
            //     uint256 nonce;
            //     uint256 deadline;
            // }
            // As you can observe, the structure must and matches exactly this contract struct on the .sol file
            // This will be passed as argument on function execution (the 'req' argument)
            // Our role here is to pack this structure on the correct way (as it is done on sig var (mutateAsync) below call
            // and signs this structure; 'to sign' means that the resultant hash means cryptographycally:
            // 'I really signed this (agreed to it)' and this can be proved by calling recover on the validation.
            // This check is done by creating a base payload using the req object (MintAgreement);
            // and checking if passed signatures (arguments) really matches the payload ones;
            // recover does:
            // It splits the playerSig bytes array into r, s, and v.
            // It uses an elliptical curve math formula combined with the original data hash (digest) to calculate: "Which public wallet address generated this mathematical signature from this specific piece of data?"
            // digest.recover answers the question: "Who signed this EXACT data?"
            // If the player changed even a single number (like the nonce or deadline) before submitting it to the smart contract,
            // digest would change, and digest.recover(playerSig) would output a completely different, random wallet address instead of the player's address.
            // Inside the function, we use keccak256(abi.encode(...)) to recreate the exact same hash (structHash / digest)
            // that the player, club, and attorney signed off-chain in their browser wallets (like MetaMask via signTypedDataV4).
            // We basically recrete the package they were supposed to have signed, that's why it is mandatory the alignment of the structures.
            // Roughly, we are doing: lets recreate the contract (in this case the structure) they were supposed to sign;
            // because a smart contract cannot verify a signature against raw data (our calldata MintAgreement), it can only verify a signature against a 32-byte hash.
            // This way we can take this digest and apply the recover function (using the digest) against the signature we are sending as arguments;
            // if the signature doesn't match with the one we are expecting to be, the process crashes.
            const message = {
                player: agreement.playerWalletAddress as `0x${string}`,
                club: agreement.clubWalletAddress as `0x${string}`,
                attorney: agreement.attorneyWalletAddress as `0x${string}`,
                tokenURI: agreement.tokenURI,
                nonce: BigInt(agreement.nonce),
                deadline: BigInt(new Date(agreement.deadline).getTime() / 1000), // to seconds
            };

            // Get domain prefix required for EIP-712
            const domain = buildMintAgreementDomain(
                RIGHTS_MINTER.address,
                chainId,
            );

            // This must exactly match the ABI encoded structure of us
            // bytes32 structHash = keccak256(
            //     abi.encode(
            //         MINT_AGREEMENT_TYPEHASH,
            //         req.player,
            //         req.club,
            //         req.attorney,
            //         keccak256(bytes(req.tokenURI)),
            //         req.nonce,
            //         req.deadline
            //     )
            // );
            const sig = await mutateAsync({
                domain,
                types: MINT_AGREEMENT_TYPES,
                primaryType: "MintAgreement",
                message,
            });

            setSignature(sig);
            setStatus("success");
            return sig;
        } catch (err: any) {
            console.error(err);
            setStatus("error");

            if (err.message.includes("User rejected")) {
                setErrorMsg("Signature request was rejected in your wallet.");
            } else {
                setErrorMsg(
                    err.shortMessage || err.message || "Signature failed.",
                );
            }
            throw err;
        }
    };

    return {
        signAgreement,
        status,
        signature,
        errorMsg,
        reset: () => {
            setStatus("idle");
            setErrorMsg(null);
            setSignature(null);
        },
    };
}

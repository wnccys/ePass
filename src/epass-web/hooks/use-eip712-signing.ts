import { useState } from 'react';
import { useSignTypedData } from 'wagmi';
import { MINT_AGREEMENT_TYPES, buildMintAgreementDomain } from '@/lib/web3/eip712';
import { RIGHTS_MINTER } from '@/lib/web3/contracts';

type SignStatus = 'idle' | 'awaiting_wallet' | 'success' | 'error';

export function useEip712Signing(chainId: number) {
  const [status, setStatus] = useState<SignStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const { mutateAsync } = useSignTypedData();

  /**
   * Create a message to be signed / manage hook status / set signature var
   * @param agreement
   * @returns
   */
  const signAgreement = async (agreement: any) => {
    try {
      setStatus('awaiting_wallet');
      setErrorMsg(null);
      setSignature(null);

      // We format the data to match the struct types exactly
      const message = {
        player: agreement.playerWalletAddress as `0x${string}`,
        club: agreement.clubWalletAddress as `0x${string}`,
        attorney: agreement.attorneyWalletAddress as `0x${string}`,
        tokenURI: agreement.tokenURI,
        nonce: BigInt(agreement.nonce),
        deadline: BigInt(new Date(agreement.deadline).getTime() / 1000), // to seconds
      };

      // Get domain prefix required for EIP-712
      const domain = buildMintAgreementDomain(RIGHTS_MINTER.address, chainId);

      const sig = await mutateAsync({
        domain,
        types: MINT_AGREEMENT_TYPES,
        primaryType: 'MintAgreement',
        message,
      });

      setSignature(sig);
      setStatus('success');
      return sig;
    } catch (err: any) {
      console.error(err);
      setStatus('error');

      if (err.message.includes('User rejected')) {
        setErrorMsg('Signature request was rejected in your wallet.');
      } else {
        setErrorMsg(err.shortMessage || err.message || 'Signature failed.');
      }
      throw err;
    }
  };

  return { signAgreement, status, signature, errorMsg, reset: () => { setStatus('idle'); setErrorMsg(null); setSignature(null); } };
}

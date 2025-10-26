import { signTransaction, isConnected } from '@stellar/freighter-api';

export interface FreighterSigningResult {
  signedXDR: string;
  success: boolean;
  error?: string;
}

/**
 * Check if Freighter is installed and connected
 */
export async function checkFreighterAvailable(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch (error) {
    console.error('Freighter not available:', error);
    return false;
  }
}

/**
 * Connect to Freighter wallet
 */
export async function connectFreighter(): Promise<boolean> {
  try {
    // Check connection status
    const result = await isConnected();
    return result.isConnected;
  } catch (error) {
    console.error('Failed to check Freighter status:', error);
    return false;
  }
}

/**
 * Sign a transaction XDR with Freighter
 */
export async function signXDRWithFreighter(
  xdr: string,
  network: 'TESTNET' | 'MAINNET' = 'TESTNET'
): Promise<FreighterSigningResult> {
  try {
    console.log('Signing XDR with Freighter...');
    console.log('Network:', network);
    
    // Use network passphrase instead of network enum
    const networkPassphrase = network === 'TESTNET' 
      ? 'Test SDF Network ; September 2015'
      : 'Public Global Stellar Network ; September 2015';
    
    const result = await signTransaction(xdr, {
      networkPassphrase
    });

    if (result.error) {
      throw new Error(result.error);
    }

    console.log('✅ XDR signed successfully');
    
    return {
      signedXDR: result.signedTxXdr,
      success: true,
    };
  } catch (error: any) {
    console.error('Failed to sign XDR with Freighter:', error);
    
    return {
      signedXDR: '',
      success: false,
      error: error?.message || 'Failed to sign transaction',
    };
  }
}

/**
 * Submit a signed XDR to the blockchain via Trustless API
 */
export async function submitSignedXDR(signedXDR: string): Promise<any> {
  try {
    console.log('=== SUBMITTING SIGNED XDR TO BACKEND ===');
    console.log('XDR length:', signedXDR.length);
    console.log('XDR (first 100 chars):', signedXDR.substring(0, 100));
    
    const response = await fetch('http://localhost:3002/api/jobs/submit-xdr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ signed_xdr: signedXDR }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit transaction');
    }

    console.log('✅ Transaction submitted to blockchain successfully');
    console.log('Result:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Failed to submit signed XDR:', error);
    throw error;
  }
}

/**
 * Full flow: Sign and submit a transaction
 */
export async function signAndSubmitTransaction(
  xdr: string,
  network: 'TESTNET' | 'MAINNET' = 'TESTNET'
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    // 1. Check Freighter availability
    const isAvailable = await checkFreighterAvailable();
    if (!isAvailable) {
      const connected = await connectFreighter();
      if (!connected) {
        return {
          success: false,
          error: 'Freighter wallet not available. Please install and connect Freighter.',
        };
      }
    }

    // 2. Sign the XDR
    const signingResult = await signXDRWithFreighter(xdr, network);
    if (!signingResult.success) {
      return {
        success: false,
        error: signingResult.error || 'Failed to sign transaction',
      };
    }

    // 3. Submit the signed XDR
    const result = await submitSignedXDR(signingResult.signedXDR);

    return {
      success: true,
      result,
    };
  } catch (error: any) {
    console.error('Error in signAndSubmitTransaction:', error);
    return {
      success: false,
      error: error?.message || 'Failed to process transaction',
    };
  }
}


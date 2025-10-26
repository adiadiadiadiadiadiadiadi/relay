import axios from 'axios';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

// Use require for CommonJS Stellar SDK
const require = createRequire(import.meta.url);
const stellarSDK = require('@stellar/stellar-sdk');
const { Horizon, Keypair, Asset, Operation, TransactionBuilder, Networks, BASE_FEE, Account, StrKey, Memo } = stellarSDK;

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || Networks.TESTNET;
const USDC_CONTRACT = process.env.TOKEN_CONTRACT || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

const server = new Horizon.Server(HORIZON_URL);

/**
 * Generate a payment transaction XDR
 * @param {string} fromAddress - Sender's Stellar address
 * @param {string} toAddress - Recipient's Stellar address
 * @param {string} amount - Amount in XLM (will be converted to stroops)
 * @param {string} memo - Optional transaction memo
 * @returns {Promise<string>} Unsigned XDR
 */
async function generatePaymentXDR(fromAddress, toAddress, amount, memo = null) {
  try {
    console.log('=== GENERATING PAYMENT XDR ===');
    console.log('From:', fromAddress);
    console.log('To:', toAddress);
    console.log('Amount:', amount);
    
    // Fetch sender's account from blockchain
    const sourceAccount = await server.loadAccount(fromAddress);
    
    // Convert amount from XLM to stroops (1 XLM = 10,000,000 stroops)
    const amountInStroops = Math.floor(parseFloat(amount) * 10000000).toString();
    
    // Build the payment transaction
    const transactionBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    
    // Add payment operation
    transactionBuilder.addOperation(
      Operation.payment({
        destination: toAddress,
        asset: Asset.native(), // Using XLM, could use USDC token here
        amount: amountInStroops,
      })
    );
    
    // Add memo if provided (memo must be 28 bytes or less)
    if (memo) {
      const memoText = memo.length > 28 ? memo.substring(0, 28) : memo;
      transactionBuilder.addMemo(Memo.text(memoText));
    }
    
    // Build transaction (timeout in 60 seconds)
    transactionBuilder.setTimeout(60);
    
    // Get XDR string (unsigned)
    const transaction = transactionBuilder.build();
    const xdrString = transaction.toXDR();
    
    console.log('✅ Payment XDR generated successfully');
    console.log('XDR length:', xdrString.length);
    
    return xdrString;
  } catch (error) {
    console.error('❌ Error generating payment XDR:', error);
    console.error('Error details:', error.message);
    throw new Error('Failed to generate payment XDR: ' + error.message);
  }
}

/**
 * Generate a payment transaction with USDC token
 * @param {string} fromAddress - Sender's Stellar address
 * @param {string} toAddress - Recipient's Stellar address
 * @param {string} amount - Amount in USDC
 * @param {string} memo - Optional transaction memo
 * @returns {Promise<string>} Unsigned XDR
 */
async function generateUSDCPaymentXDR(fromAddress, toAddress, amount, memo = null) {
  try {
    console.log('=== GENERATING USDC PAYMENT XDR ===');
    console.log('From:', fromAddress);
    console.log('To:', toAddress);
    console.log('Amount (USDC):', amount);
    
    // Fetch sender's account from blockchain
    const sourceAccount = await server.loadAccount(fromAddress);
    
    // For USDC, we use the contract ID
    const amountInStroops = Math.floor(parseFloat(amount) * 10000000).toString();
    
    // Create USDC asset
    const usdcAsset = new Asset(
      'USDC',
      USDC_CONTRACT.substring(0, 56) // Issuer address
    );
    
    // Build the payment transaction
    const transactionBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    
    // Add payment operation
    transactionBuilder.addOperation(
      Operation.payment({
        destination: toAddress,
        asset: usdcAsset,
        amount: amountInStroops,
      })
    );
    
    // Add memo if provided (memo must be 28 bytes or less)
    if (memo) {
      const memoText = memo.length > 28 ? memo.substring(0, 28) : memo;
      transactionBuilder.addMemo(Memo.text(memoText));
    }
    
    // Build transaction (timeout in 60 seconds)
    transactionBuilder.setTimeout(60);
    
    // Get XDR string (unsigned)
    const transaction = transactionBuilder.build();
    const xdrString = transaction.toXDR();
    
    console.log('✅ USDC Payment XDR generated successfully');
    
    return xdrString;
  } catch (error) {
    console.error('❌ Error generating USDC payment XDR:', error);
    throw new Error('Failed to generate USDC payment XDR: ' + error.message);
  }
}

/**
 * Submit a signed transaction to the Stellar network
 * @param {string} signedXDR - Signed XDR transaction
 * @returns {Promise<any>} Transaction result
 */
async function submitTransaction(signedXDR) {
  try {
    console.log('=== SUBMITTING TRANSACTION TO STELLAR ===');
    console.log('XDR length:', signedXDR.length);
    
    // Submit to Stellar network
    const result = await server.submitTransaction(
      TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE)
    );
    
    console.log('✅ Transaction submitted successfully');
    console.log('Transaction hash:', result.hash);
    
    return {
      success: true,
      hash: result.hash,
      result
    };
  } catch (error) {
    console.error('❌ Error submitting transaction:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw new Error('Failed to submit transaction: ' + (error.response?.data?.extras?.result_codes || error.message));
  }
}

/**
 * Get account balance for an address
 * @param {string} address - Stellar address
 * @returns {Promise<{xlm: string, usdc: string}>}
 */
async function getAccountBalance(address) {
  try {
    const account = await server.loadAccount(address);
    
    const xlmBalance = account.balances.find(b => b.asset_type === 'native');
    const usdcBalance = account.balances.find(b => 
      b.asset_code === 'USDC' || b.asset_issuer === USDC_CONTRACT
    );
    
    return {
      xlm: xlmBalance?.balance || '0.0000000',
      usdc: usdcBalance?.balance || '0.0000000'
    };
  } catch (error) {
    console.error('Error fetching account balance:', error);
    throw error;
  }
}

/**
 * Check if account exists
 * @param {string} address - Stellar address
 * @returns {Promise<boolean>}
 */
async function accountExists(address) {
  try {
    await server.loadAccount(address);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get the payment details for approval flow
 * Creates XDRs that need to be signed
 * @param {string} jobId - Job ID
 * @param {string} employerAddress - Employer's wallet address
 * @param {string} freelancerAddress - Freelancer's wallet address
 * @param {string} amount - Payment amount
 * @returns {Promise<{paymentXDR: string}>}
 */
async function generateApprovalPayment(jobId, employerAddress, freelancerAddress, amount) {
  try {
    console.log('=== GENERATING APPROVAL PAYMENT ===');
    console.log('Job ID:', jobId);
    console.log('Employer:', employerAddress);
    console.log('Freelancer:', freelancerAddress);
    console.log('Amount:', amount);
    
    // Create the payment XDR (native XLM for now)
    const paymentXDR = await generatePaymentXDR(
      employerAddress,
      freelancerAddress,
      amount,
      `Payment for job: ${jobId}`
    );
    
    console.log('✅ Payment XDR ready for signing');
    
    return {
      paymentXDR,
      instructions: 'Sign this XDR with Freighter and submit to complete payment',
      network: 'TESTNET',
      from: employerAddress,
      to: freelancerAddress,
      amount: amount
    };
  } catch (error) {
    console.error('❌ Error generating approval payment:', error);
    throw error;
  }
}

export default {
  generatePaymentXDR,
  generateUSDCPaymentXDR,
  submitTransaction,
  getAccountBalance,
  accountExists,
  generateApprovalPayment
};


import { 
  Contract, 
  Address, 
  StrKey,
  xdr,
  Networks,
  SorobanDataBuilder
} from '@stellar/stellar-sdk';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ESCROW_CONTRACT_ID = process.env.ESCROW_CONTRACT_ID;
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

/**
 * Create a new escrow and lock funds
 * @param {string} escrowId - Unique escrow ID
 * @param {string} jobId - Job ID from database
 * @param {string} employerAddress - Employer's Stellar address
 * @param {string} employeeAddress - Employee's Stellar address
 * @param {string} tokenAddress - Token contract address (USDC)
 * @param {number} amount - Amount in stroops
 * @param {number} deadline - Optional deadline timestamp
 * @returns {Promise<string>} XDR to sign
 */
export async function createEscrow(
  escrowId,
  jobId,
  employerAddress,
  employeeAddress,
  tokenAddress,
  amount,
  deadline = null
) {
  try {
    console.log('=== CREATING ESCROW ON SOROBAN ===');
    console.log('Contract ID:', ESCROW_CONTRACT_ID);
    console.log('Escrow ID:', escrowId);
    console.log('Job ID:', jobId);
    console.log('Employer:', employerAddress);
    console.log('Employee:', employeeAddress);
    console.log('Token:', tokenAddress);
    console.log('Amount:', amount);
    
    if (!ESCROW_CONTRACT_ID) {
      throw new Error('ESCROW_CONTRACT_ID not set in environment');
    }

    // Create contract instance
    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    // Convert addresses to Soroban Address format
    const employerPubKey = StrKey.decodeEd25519PublicKey(employerAddress);
    const employeePubKey = StrKey.decodeEd25519PublicKey(employeeAddress);
    const tokenPubKey = StrKey.decodeEd25519PublicKey(tokenAddress);
    
    const employerAddr = Address.fromEd25519PublicKey(employerPubKey).toScAddress();
    const employeeAddr = Address.fromEd25519PublicKey(employeePubKey).toScAddress();
    const tokenAddr = Address.fromEd25519PublicKey(tokenPubKey).toScAddress();
    
    // Prepare arguments
    const args = [
      xdr.ScVal.scvString(escrowId),        // escrow_id
      xdr.ScVal.scvString(jobId),           // job_id
      employerAddr,                         // employer
      employeeAddr,                         // employee
      tokenAddr,                            // token
      xdr.ScVal.scvI128(xdr.Int128Parts.fromString(amount)), // amount
      deadline ? xdr.ScVal.scvI64(xdr.Int64.fromString(deadline)) : xdr.ScVal.scvVoid() // deadline
    ];
    
    // This returns contract invocation info (not a transaction)
    // Frontend will need to build and sign the actual transaction
    
    return {
      contract_id: ESCROW_CONTRACT_ID,
      function_name: 'create_escrow',
      args: args,
      escrow_id: escrowId,
      job_id: jobId,
      employer: employerAddress,
      employee: employeeAddress,
      token: tokenAddress,
      amount: amount,
      deadline: deadline,
      network_passphrase: NETWORK_PASSPHRASE,
      instructions: 'Employer must sign this to lock funds in escrow'
    };
    
  } catch (error) {
    console.error('❌ Error creating escrow:', error);
    throw error;
  }
}

/**
 * Approve escrow and release funds to employee
 * @param {string} escrowId - Escrow ID
 * @param {string} employerAddress - Employer's address
 * @returns {Promise<string>} XDR to sign
 */
export async function approveEscrow(escrowId, employerAddress) {
  try {
    console.log('=== APPROVING ESCROW ON SOROBAN ===');
    console.log('Escrow ID:', escrowId);
    console.log('Employer:', employerAddress);
    
    if (!ESCROW_CONTRACT_ID) {
      throw new Error('ESCROW_CONTRACT_ID not set in environment');
    }

    const contract = new Contract(ESCROW_CONTRACT_ID);
    const employerPubKey = StrKey.decodeEd25519PublicKey(employerAddress);
    const employerAddr = Address.fromEd25519PublicKey(employerPubKey).toScAddress();
    
    const args = [
      xdr.ScVal.scvString(escrowId),
      employerAddr
    ];
    
    return {
      contract_id: ESCROW_CONTRACT_ID,
      function_name: 'approve_escrow',
      args: args,
      escrow_id: escrowId,
      employer: employerAddress,
      network_passphrase: NETWORK_PASSPHRASE
    };
    
  } catch (error) {
    console.error('❌ Error approving escrow:', error);
    throw error;
  }
}

/**
 * Cancel escrow and return funds to employer
 * @param {string} escrowId - Escrow ID
 * @param {string} employerAddress - Employer's address
 * @returns {Promise<string>} XDR to sign
 */
export async function cancelEscrow(escrowId, employerAddress) {
  try {
    console.log('=== CANCELLING ESCROW ON SOROBAN ===');
    console.log('Escrow ID:', escrowId);
    console.log('Employer:', employerAddress);
    
    if (!ESCROW_CONTRACT_ID) {
      throw new Error('ESCROW_CONTRACT_ID not set in environment');
    }

    const contract = new Contract(ESCROW_CONTRACT_ID);
    const employerPubKey = StrKey.decodeEd25519PublicKey(employerAddress);
    const employerAddr = Address.fromEd25519PublicKey(employerPubKey).toScAddress();
    
    const args = [
      xdr.ScVal.scvString(escrowId),
      employerAddr
    ];
    
    return {
      contract_id: ESCROW_CONTRACT_ID,
      function_name: 'cancel_escrow',
      args: args,
      escrow_id: escrowId,
      employer: employerAddress,
      network_passphrase: NETWORK_PASSPHRASE
    };
    
  } catch (error) {
    console.error('❌ Error cancelling escrow:', error);
    throw error;
  }
}

/**
 * Get escrow details from contract
 * @param {string} escrowId - Escrow ID
 * @returns {Promise<any>} Escrow details
 */
export async function getEscrow(escrowId) {
  try {
    console.log('=== QUERYING ESCROW FROM SOROBAN ===');
    console.log('Escrow ID:', escrowId);
    
    if (!ESCROW_CONTRACT_ID) {
      throw new Error('ESCROW_CONTRACT_ID not set in environment');
    }

    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    const args = [
      xdr.ScVal.scvString(escrowId)
    ];
    
    // This is a read operation - no signing needed
    return {
      contract_id: ESCROW_CONTRACT_ID,
      function_name: 'get_escrow',
      args: args,
      escrow_id: escrowId
    };
    
  } catch (error) {
    console.error('❌ Error getting escrow:', error);
    throw error;
  }
}

/**
 * Check if escrow is locked
 * @param {string} escrowId - Escrow ID
 * @returns {Promise<boolean>} Is locked
 */
export async function isEscrowLocked(escrowId) {
  try {
    if (!ESCROW_CONTRACT_ID) {
      return false;
    }

    const contract = new Contract(ESCROW_CONTRACT_ID);
    
    const args = [
      xdr.ScVal.scvString(escrowId)
    ];
    
    return {
      contract_id: ESCROW_CONTRACT_ID,
      function_name: 'is_locked',
      args: args,
      escrow_id: escrowId
    };
    
  } catch (error) {
    console.error('❌ Error checking escrow lock:', error);
    return false;
  }
}

export default {
  createEscrow,
  approveEscrow,
  cancelEscrow,
  getEscrow,
  isEscrowLocked
};


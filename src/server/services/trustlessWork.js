const axios = require('axios');
require('dotenv').config();

const TRUSTLESS_WORK_API_URL = 'https://api.trustlesswork.com';
const API_KEY = process.env.TRUSTLESS_KEY;


// Axios instance with auth header
const trustlessAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Create a single-release escrow
 * @param {string} serviceProvider - Freelancer wallet address
 * @param {string} approver - Client wallet address
 * @param {string} receiver - Receiver wallet address (usually same as serviceProvider)
 * @param {string} disputeResolver - Dispute resolver wallet address
 * @param {number} deadline - Unix timestamp
 * @param {string} amount - Amount in stroops (string)
 * @param {string} token - Token contract address (USDC)
 * @returns {Promise<{xdr: string, escrow_id: string}>}
 */
async function createEscrow(serviceProvider, approver, receiver, disputeResolver, deadline, amount, token) {
  try {
    const response = await trustlessAPI.post('/deployer/single-release', {
      service_provider: serviceProvider,
      approver: approver,
      receiver: receiver,
      dispute_resolver: disputeResolver,
      deadline: deadline,
      amount: amount,
      token: token
    });

    return {
      xdr: response.data.xdr,
      escrow_id: response.data.escrow_id
    };
  } catch (error) {
    console.error('Trustless Work API Error (createEscrow):', error.response?.data || error.message);
    throw new Error('Failed to create escrow');
  }
}



/**
 * Fund an escrow
 * @param {string} escrowId - Escrow ID
 * @param {string} funder - Funder wallet address
 * @param {string} amount - Amount in stroops
 * @returns {Promise<{xdr: string}>}
 */
async function fundEscrow(escrowId, funder, amount) {
  try {
    const response = await trustlessAPI.post('/escrow/single-release/fund-escrow', {
      escrow_id: escrowId,
      funder: funder,
      amount: amount
    });

    return { xdr: response.data.xdr };
  } catch (error) {
    console.error('Trustless Work API Error (fundEscrow):', error.response?.data || error.message);
    throw new Error('Failed to fund escrow');
  }
}

/**
 * Approve milestone (work completed)
 * @param {string} escrowId - Escrow ID
 * @param {string} approver - Approver wallet address
 * @returns {Promise<{xdr: string}>}
 */
async function approveMilestone(escrowId, approver) {
  try {
    const response = await trustlessAPI.post('/escrow/single-release/approve-milestone', {
      escrow_id: escrowId,
      approver: approver
    });

    return { xdr: response.data.xdr };
  } catch (error) {
    console.error('Trustless Work API Error (approveMilestone):', error.response?.data || error.message);
    throw new Error('Failed to approve milestone');
  }
}

/**
 * Release funds to receiver
 * @param {string} escrowId - Escrow ID
 * @param {string} receiver - Receiver wallet address
 * @returns {Promise<{xdr: string}>}
 */
async function releaseFunds(escrowId, receiver) {
  try {
    const response = await trustlessAPI.post('/escrow/single-release/release-funds', {
      escrow_id: escrowId,
      receiver: receiver
    });

    return { xdr: response.data.xdr };
  } catch (error) {
    console.error('Trustless Work API Error (releaseFunds):', error.response?.data || error.message);
    throw new Error('Failed to release funds');
  }
}

/**
 * Submit signed transaction to Stellar
 * @param {string} signedXDR - Signed XDR transaction
 * @returns {Promise<any>}
 */
async function submitTransaction(signedXDR) {
  try {
    const response = await trustlessAPI.post('/helper/send-transaction', {
      xdr: signedXDR
    });

    return response.data;
  } catch (error) {
    console.error('Trustless Work API Error (submitTransaction):', error.response?.data || error.message);
    throw new Error('Failed to submit transaction');
  }
}

/**
 * Get escrow details
 * @param {string} escrowId - Escrow ID
 * @returns {Promise<any>}
 */
async function getEscrow(escrowId) {
  try {
    const response = await trustlessAPI.get('/escrow/single-release/get-escrow', {
      params: { escrow_id: escrowId }
    });

    return response.data;
  } catch (error) {
    console.error('Trustless Work API Error (getEscrow):', error.response?.data || error.message);
    throw new Error('Failed to get escrow');
  }
}

module.exports = {
  createEscrow,
  fundEscrow,
  approveMilestone,
  releaseFunds,
  submitTransaction,
  getEscrow
};
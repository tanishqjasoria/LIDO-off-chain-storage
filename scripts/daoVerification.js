const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams } = require('./merkel')
const { addToIPFS, getKeyStoreIPFS} = require('./ipfs')
const { getNodeOperatorDetails, updateNodeOperatorDetails, approveKeys } = require('./contract')


//[DAO Verification]: Main Function ------------------------------------------------------------------------------------
module.exports = async function main(callback) {
  try {

    await verifyKeyStore()
    callback(0);

  } catch (error) {
    console.error(error);
    callback(1);
  }
}


//[DAO Verification]: Utility Functions --------------------------------------------------------------------------------
async function verifyKeyStore() {
  let ret_obj = await getNodeOperatorDetails()
  let ipfsHash = ret_obj['0']
  let merkelRoot = ret_obj['1']
  let usedKeys = ret_obj['2']

  let keyStore = await getKeyStoreIPFS(ipfsHash.toString())

  // Verify the merkle root
  if (verifyMerkelRoot(keyStore, merkelRoot)) {
    console.log("Merkel Verification Passed")
  } else {
    throw new Error('Merkle Verification Failed')
  }

  // Check of duplicates
  if (checkDuplicates(keyStore)) {
    console.log("No Duplicates Found")
  } else {
    throw new Error('Duplicate Keys Found')
  }

  // TODO: check for correct credentials

  // Add additional checks for verification
  // If changes required - update the IPFS Hash and Merkle Root in the contract
  const newTotalKeys = keyStore[keyStore.length -1][startIndex] + keyStore[keyStore.length -1][totalKeys] - 1

  await approveKeys(ipfsHash, merkelRoot, newTotalKeys)
}

function checkDuplicates(keyStore) {

  let keySet = new Set()
  for (let i=0; i < keyStore.length; i++) {
    let block = keyStore[i]
    console.log(block)
    for (let j=0; j < block.keyList.length; j++) {
      console.log(block.keyList[j].pubKey)
      if ( keySet.has(block.keyList[j].pubKey) ) {
        return false
      } else {
        keySet.add(block.keyList[j].pubKey)
      }
    }
  }
  return true
}

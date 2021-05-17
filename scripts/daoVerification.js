const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams } = require('./merkel')
const { addToIPFS, getKeyStoreIPFS} = require('./ipfs')
const { getNodeOperatorDetails, updateNodeOperatorDetails, approveKeys } = require('./contract')
const contract = artifacts.require("NodeOperatorsRegistry")
const LOG_STRING = '[DAO Verification]: '

//[DAO Verification]: Main Function ------------------------------------------------------------------------------------
module.exports = async function main(callback) {
  try {
    console.log(LOG_STRING, 'Starting...')
    await verifyKeyStore()
    callback(0);

  } catch (error) {
    console.error(error);
    callback(1);
  }
}


//[DAO Verification]: Utility Functions --------------------------------------------------------------------------------
async function verifyKeyStore() {

  let { ipfsHash, merkelRoot, usedKeys } = await getNodeOperatorDetails(contract)

  let keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  console.log(LOG_STRING, 'Key Store Length - ', keyStore.length)
  console.log(LOG_STRING, 'Used Keys - ', usedKeys)
  console.log(LOG_STRING, 'Total Keys - ', keyStore[keyStore.length - 1].startIndex + keyStore[keyStore.length - 1].totalKeys - 1)


  if (verifyMerkelRoot(keyStore, merkelRoot)) {
    console.log(LOG_STRING, "Merkel Verification Passed")
  } else {
    throw new Error(LOG_STRING + 'Merkle Verification Failed')
  }


  if (checkDuplicates(keyStore)) {
    console.log(LOG_STRING, "No Duplicates Found")
  } else {
    throw new Error(LOG_STRING + 'Duplicate Keys Found')
  }

  // TODO: check for correct credentials

  // Add additional checks for verification
  // If changes required - update the IPFS Hash and Merkle Root in the contract
  const newTotalKeys = keyStore[keyStore.length -1]["startIndex"] + keyStore[keyStore.length -1]["totalKeys"] - 1
  console.log(LOG_STRING, 'Approving Keys...')
  console.log(LOG_STRING, 'New keys approving - ', newTotalKeys)
  console.log(LOG_STRING, 'IPHS Hash - ', ipfsHash)
  console.log(LOG_STRING, 'Merkle Root - ', merkelRoot)

  await approveKeys(contract, ipfsHash, merkelRoot, newTotalKeys)
}

function checkDuplicates(keyStore) {

  let keySet = new Set()
  for (let i=0; i < keyStore.length; i++) {
    let block = keyStore[i]
    for (let j=0; j < block.keyList.length; j++) {
      if ( keySet.has(block.keyList[j].pubKey) ) {
        return false
      } else {
        keySet.add(block.keyList[j].pubKey)
      }
    }
  }
  return true
}

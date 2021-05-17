const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams }= require('./merkel')
const { getFromIPFS, addToIPFS, getKeyStoreIPFS } = require('./ipfs')
const { getNodeOperatorDetails, updateNodeOperatorDetails, approveKeys, depositBufferEther } = require('./contract')
const contract = artifacts.require("NodeOperatorsRegistry")
const LOG_STRING = '[Deposit Buffer Ether]: '


//[Deposit Buffer ETH]: Main Function ----------------------------------------------------------------------------------
module.exports = async function main(callback) {
  try {
    console.log(LOG_STRING, 'Starting...')
    let proof = await assignNextKeys()
    callback(0);

  } catch (error) {
    console.error(error);
    callback(1);
  }
}


//[Deposit Buffer ETH]: Utility Functions ------------------------------------------------------------------------------
async function assignNextKeys() {

  let { ipfsHash, merkelRoot, usedKeys } = await getNodeOperatorDetails(contract)
  console.log(LOG_STRING, "Node Operator Details: ", ipfsHash, merkelRoot, usedKeys)

  let keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  console.log(LOG_STRING, 'Key Store length - ', keyStore.length)

  let block;
  for (let i=0; i < keyStore.length; i++){
    if (keyStore[i].startIndex >= usedKeys + 1) {
      block = keyStore[i]
      break
    }
  }

  if(!block){
    console.log(LOG_STRING, "No unused keys block found!")
    return
  }
  console.log(LOG_STRING, "Depositing Ether, Keys starting index: ", block.startIndex)
  console.log(LOG_STRING, 'Generating Proof for Merkle Verification...')
  let proof = getVerificationParams(keyStore, block)

  console.log(LOG_STRING, 'New Keys being used for deposit - ', block.totalKeys)
  await depositBufferEther(contract, proof, block.pubKeysHex, block.signatureHex, block.totalKeys)
  console.log(LOG_STRING, 'Deposit Buffer Ether contract call SUCCESS')

}

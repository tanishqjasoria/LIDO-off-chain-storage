# Open DeFi Hackathon: Off-Chain Storage &amp; Management For Lido Validators' Keys
[comment]: <> (Gitcoin Open DeFi Hackathon: Off-Chain Storage &amp; Management For Lido Validators' Keys)

This is a proof of concept implementation of the key management smart contract, off-chain tooling, and the demo code for
the happy-path scenario. 

## Overview of the System

Keys would be stored off-chain using the IPFS Protocol and IPFS Hash would be stored on-chain, separate for each node
operator, preferably in the NodeOperator struct. A merkle root would also be stored on chain for verification purposes. 
Dao would verify the keys and then update approvedIpfsHash and approvedMerkleRoot, also in NodeOperator struct, after 
verification. User would submit keys with merkle proofs as arguments to depositBufferEther call. The keys would be
verified using the approvedMerkleRoot and after successful verification, _ETH2Deposit function call would be processed.

### Off-chain Key Storage

The keys would be stored off-chain using IPFS protocol. The data structure used to manage keyStore is somewhat similar 
to a blockchain. New added keys would be store in form of a block with a limit on max number keys stored. The structure 
of a block would be

```
currentBlock = {
    startIndex: previousIndex + 1,
    totalKeys:0,
    keyList: [],
    pubKeysHex:'',
    signatureHex:''
}
```
Here, 
1. *startIndex* would represent the index of the first key that would be stored in the block.
2. *totalKeys* would be the number of keys added in that block, it would be limited by a parameter *MAX_BLOCK_SIZE*. 
3. *keyList* would contain the list of keyObjects stored in the block. 
   ```
   keyObject = {
      pubKey: crypto.randomBytes(PUBKEY_LENGTH).toString('hex'),
      signature: crypto.randomBytes(SIGNATURE_LENGTH).toString('hex')
    }
   ```
4. *pubKeysHex* and *signatureHex* are used to store the public keys and signature in the same format as required by the
   __\_ETH2Deposit__ function in Lido contract. These fields are treated as leaves in the merkle tree used to generate 
   the merkel root.
   
Once a block is created, and the corresponding merkleRoot is approved(approval process discussed in the next section) on
the contract. No more keys should be added in that block even if the MAX_BLOCK_SIZE is not reached. This needs to be
verified during the approval process.

The reason behind the design choice, bundling the keys in block, is ease of verification when depositBufferEth is
called. __block[pubKeysHex] + block[signatureHex]__ acts as leaves of the merkle tree used to generate the merkle
root. All the keys in a particular block can be verified using single merkle proof. The compromise with this approach is
that each depositBufferEth call can only be done in batches, restricted by the keys in a block.

After adding new blocks to the keyStore, the user would update ipfsHash and merkleRoot on the contract.


### DAO Verification

The updated keyStore would be obtained from IPFS using the ipfsHash updated by the user. DAO will carry
out all the required verification and update approvedIpfsHash and approvedMerkleRoot with ipfsHash and merkleRoot
updated by the user in the previous step. It will also update the total approvedKeys in the contract.

If the verification fails, either the DAO can reject the update by reverting ipfsHash and merkleRoot, or it can
remove the invalid entries, add the new keyStore to IPFS, calculate merkleRoot and directly update the approvedIpfsHash 
and approvedMerkleRoot with these new values. In PoC the current behaviour is rejection. 

### Deposit Buffer Ether 

The user will obtain the keyStore using the approvedIpfsHash. Newly added blocks can be found using the usedKeys 
(representing the number of keys already used to deposit ether). Now user can generate a merkle proof for a newly added 
block and pass the arguments [proof, block.pubKeysHex, block.signatureHex, block.totalKeys] to the depositBufferEther 
call. The function verifies the block using the approvedMerkelRoot and then call the _ETH2Deposit
function with arguments [block.pubKeysHex, block.signatureHex].

It can also be modified to allow user to submit multiple blocks of keys in a single call. Here user would have to generate 
merkle proof for each block separately and submit the array with [proof, block.pubKeysHex, block.signatureHex, 
block.totalKeys] for each block. In PoC the user is only allowed to submit a single block at a time.


### Demo

All the important scripts are in the directory ```scripts/```. The important scripts for valid happy paths are:

1. ```scripts/nodeOperator.js```: To mock behaviour of node operator. This script:
   - print stored ipfsHash and merkleRoot on the contract.
   - generate 200 unique pairs of key-signature and upload them to IPFS. This behaviour can be modified by uncommenting 
     ```let keyList = getGeneratedKeys()``` at ```line 22```. Now it will read keys from ```deposit_data-1621224704.json```
     generated using instruction in ```node-operator-manual.md```
   - calculate the merkle root and then update ipfsHash and merkleRoot in the contract
   
2. ```scripts/daoVerification.js```: To mock behaviour of DAO for verification. This script:
   - fetch keyStore from IPFS using the ipfsHash
   - verify the keystore against merkleRoot
   - check of duplicates
   - if everything is verified, updates the approvedIpfsHash, approvedMerkleRoot and newApprovedKeys

3. ```scripts/depositBufferEth.js```: To mock behaviour of a stranger (making the depositBufferEth call to contract). This script:
   - fetch keyStore from IPFS using the approvedIpfsHash
   - finds the block of keys to be used to deeposit ether
   - generated proof for that block
   - call depositBufferEther with arguments[proof, block.pubKeysHex, block.signatureHex, block.totalKeys]
   
```scripts/nodeOperatorDup.js``` and ```scripts/depositEthInvalid.js``` are used to mock the situations where the tasks
are not performed correctly by the designated entity.

For testing on local machine
 - ```npm install```: to install all the dependencies.
 - ```npm run ganache```: to launch a local instance of blockchain.
 - ```npm run migrate```: to deploy the NodeOperatorRegistry contract.
 - ```npm run node_operator```: mock node operator behaviour using ```scripts/nodeOperator.js```
 - ```npm run dao_verification```: mock DAO verification using ```scripts/daoVerification.js```
 - ```npm run deposit_ether```: mock behaviour of a stranger (making the depositBufferEth call to contract) using ```scripts/depositBufferEth.js```


Some combination of behaviours can be directly tested by the shell scripts provided in the root directory. Start local
blockchain instance using ```npm run ganache``` before using the scripts.

- ```validHappyPath.sh```: every entity performs the required behaviour correctly.
- ```invalidHappyPathDupKeys.sh```: node operator adds duplicate keys, which result in failed verification, thus failed
deposit ether call.
- ```invalidHappyPathNotApproved.sh```: deposit ether is called before being approved by the DAO, contract call fails
- ```invalidHappyPathInvalidProof.sh```: when deposit ether is called using invalid public keys, contract call fails
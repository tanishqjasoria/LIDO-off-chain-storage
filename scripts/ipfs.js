const ipfsAPI = require('ipfs-http-client');
const { globSource, create } = ipfsAPI
const ipfs = create({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
const BufferList = require('bufferlist').BufferList;

async function getKeyStoreIPFS(ipfsHash) {
  const content = await getFromIPFS(ipfsHash)
  return JSON.parse(content.toString())
}

const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    if (!file.content) continue;
    const content = new BufferList()
    for await (const chunk of file.content) {
      content.push(chunk)
    }
    return content
  }
}

const addToIPFS = async keyStore => {
  return await ipfs.add(keyStore)
}

module.exports = { getFromIPFS, addToIPFS, getKeyStoreIPFS }
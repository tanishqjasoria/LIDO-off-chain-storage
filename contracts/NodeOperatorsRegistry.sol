// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/cryptography/MerkleProof.sol';

contract NodeOperatorsRegistry {
    address public nodeOperator;
    address public governance;

    modifier onlyNodeOperator() {
        require(msg.sender == nodeOperator, "AUTH_FAILED");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "AUTH_FAILED");
        _;
    }

    struct PubkeyAndSignature {
        bytes pubkey;
        bytes signature;
    }

    PubkeyAndSignature[] public keys;

    uint256 public approvedKeys;
    uint256 public usedKeys;
    // adding here for after keys not stored in contract
    uint256 public totalKeysCount;
    string public ipfsHash;
    string public merkelRoot;

    constructor (address _nodeOperator, address _governance) public {
        nodeOperator = _nodeOperator;
        governance = _governance;
        totalKeysCount = 0;
    }

    function totalKeys() public view returns (uint256) {
        return keys.length;
    }

//    function verify(
//        bytes32 root,
//        bytes32 leaf,
//        bytes32[] memory proof
//    )
//    public
//    pure
//    returns (bool)
//    {
//        bytes32 computedHash = leaf;
//
//        for (uint256 i = 0; i < proof.length; i++) {
//            bytes32 proofElement = proof[i];
//
//            if (computedHash < proofElement) {
//                // Hash(current computed hash + current element of the proof)
//                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
//            } else {
//                // Hash(current element of the proof + current computed hash)
//                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
//            }
//        }
//
//        // Check if the computed hash (root) is equal to the provided root
//        return computedHash == root;
//    }

    function getOperatorDetails() public view returns (string memory, string memory, uint256) {
        return (ipfsHash, merkelRoot, usedKeys);

    }

    function updateOperatorDetails(string memory _ipfsHash, string memory _merkelRoot, uint256 _newKeysCount) external onlyNodeOperator {
        // add new pubkey and signature
        ipfsHash = _ipfsHash;
        merkelRoot = _merkelRoot;
        totalKeysCount = totalKeysCount + _newKeysCount;
    }

    function verify(bytes32  root, bytes32[] memory proof, string memory _pubKeys, string memory signature) public view returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(_pubKeys, signature));
        return MerkleProof.verify(proof, root, leaf);
    }

    function addKey(bytes memory _pubkey, bytes memory _signature) external onlyNodeOperator {
        // add new pubkey and signature
        keys.push(PubkeyAndSignature(_pubkey, _signature));
    }

    function approveKeys(uint256 newApprovedKeys) external onlyGovernance {
        approvedKeys = newApprovedKeys;
    }

    function depositBufferedEther() external {
        // all checks
        // _stake(pubkey, signature);
        usedKeys = usedKeys + 1;
    }

//    function _stake(bytes memory _pubkey, bytes memory _signature) internal {
//        // actually call deposit function, might be a mock
//    }
}
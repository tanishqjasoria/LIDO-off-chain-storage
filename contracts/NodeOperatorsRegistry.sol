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

    uint256 public approvedKeys;
    uint256 public usedKeys;
    uint256 public totalKeysCount;
    bytes32 public ipfsHash;
    bytes32 public merkelRoot;
    bytes32 public approvedIpfsHash;
    bytes32 public approvedMerkelRoot;

    constructor (address _nodeOperator, address _governance) public {
        nodeOperator = _nodeOperator;
        governance = _governance;
        totalKeysCount = 0;
    }


    function getOperatorDetails() public view returns (bytes32, bytes32, uint256) {
        return (ipfsHash, merkelRoot, usedKeys);

    }

    function updateOperatorDetails(bytes32 _ipfsHash, bytes32 _merkelRoot, uint256 _newKeysCount) external onlyNodeOperator {
        // add new pubkey and signature
        ipfsHash = _ipfsHash;
        merkelRoot = _merkelRoot;
        totalKeysCount = totalKeysCount + _newKeysCount;
    }

    function verify(bytes32[] memory proof, string memory pubKeys, string memory signature) public returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(pubKeys, signature));
        return MerkleProof.verify(proof, approvedMerkelRoot, leaf);
    }


    function approveKeys(bytes32 _ipfsHash, bytes32 _merkelRoot, uint256 newApprovedKeys) external onlyGovernance {
        approvedKeys = newApprovedKeys;
        approvedIpfsHash = _ipfsHash;
        approvedIpfsHash = _merkelRoot;
    }

    function depositBufferedEther(bytes32[] memory proof, string memory pubKeys, string memory signature, uint256 keyCount) external {
        // all checks
        // _stake(pubkey, signature);
        require(verify(proof, pubKeys, signature));
        require(usedKeys + keyCount <= approvedKeys);
        usedKeys = usedKeys + keyCount;
    }

//    function _stake(bytes memory _pubkey, bytes memory _signature) internal {
//        // actually call deposit function, might be a mock
//    }
}
pragma solidity ^0.8.1;

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
    string public ipfsHash;
    string public merkelRoot;

    constructor(address _nodeOperator, address _governance) {
        nodeOperator = _nodeOperator;
        governance = _governance;
    }

    function totalKeys() public view returns (uint256) {
        return keys.length;
    }

    function getIPFSHashMerkelRoot() public view returns (string memory, string memory) {
        return (ipfsHash, merkelRoot);

    }

    function addKey(bytes memory _pubkey, bytes memory _signature) external onlyNodeOperator {
        // add new pubkey and signature
        keys.push(PubkeyAndSignature(_pubkey, _signature));
    }

    function addIPFSHashMerkelRoot(string memory _ipfsHash, string memory _merkelRoot) external onlyNodeOperator {
        // add new pubkey and signature
        ipfsHash = _ipfsHash;
        merkelRoot = _merkelRoot;
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
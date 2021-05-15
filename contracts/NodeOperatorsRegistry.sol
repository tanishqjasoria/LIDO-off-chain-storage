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

    constructor(address _nodeOperator, address _governance) {
        nodeOperator = _nodeOperator;
        governance = _governance;
    }

    function totalKeys() public view returns (uint256) {
        return keys.length;
    }

    function getIPFSHash() public view returns (string memory) {
        return ipfsHash;
    }

    function addKey(bytes memory _pubkey, bytes memory _signature) external onlyNodeOperator {
        // add new pubkey and signature
        keys.push(PubkeyAndSignature(_pubkey, _signature));
    }

    function addIPFSHash(string memory _ipfsHash) external onlyNodeOperator {
        // add new pubkey and signature
        ipfsHash = _ipfsHash;
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
// VERIFIED WORKING SETUP
// -----------------------

// ✅ SMART CONTRACT (contracts/SentinelChain.sol)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SentinelChain {
    struct Threat {
        uint threatId;
        string description;
        uint timestamp;
    }

    mapping(uint => Threat) public threats;
    uint public threatCount;

    event ThreatReported(uint threatId, string description, uint timestamp);

    function reportThreat(string memory _description) public {
        threatCount++;
        threats[threatCount] = Threat(threatCount, _description, block.timestamp);
        emit ThreatReported(threatCount, _description, block.timestamp);
    }

    function getLatestThreat() public view returns (string memory, uint) {
        if (threatCount == 0) return ("No threats reported yet", 0);
        Threat memory t = threats[threatCount];
        return (t.description, t.timestamp);
    }
}

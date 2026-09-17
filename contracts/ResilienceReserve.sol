// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Educational reserve blueprint. NOT audited, deployed, or connected to the UI.
/// @dev Uses native test-chain units, not INR. An off-chain reviewer attests need;
///      the contract cannot know whether income data or a hardship claim is true.
contract ResilienceReserve {
    address public immutable sponsor;
    struct Plan { address payable borrower; uint256 remaining; bool consented; }
    mapping(bytes32 => Plan) public plans;
    mapping(address => bytes32) public activePlan;
    event Proposed(bytes32 indexed planHash, address indexed borrower, uint256 cap);
    event Consented(bytes32 indexed planHash);
    event Released(bytes32 indexed planHash, uint256 amount, bytes32 evidenceHash);
    constructor() { sponsor = msg.sender; }
    modifier onlySponsor() { require(msg.sender == sponsor, "Sponsor only"); _; }
    receive() external payable {}
    function propose(bytes32 planHash, address payable borrower, uint256 cap) external onlySponsor {
        require(planHash != bytes32(0) && borrower != address(0) && cap > 0, "Invalid plan");
        require(plans[planHash].borrower == address(0), "Version already exists");
        plans[planHash] = Plan(borrower, cap, false);
        emit Proposed(planHash, borrower, cap);
    }
    function consent(bytes32 planHash) external {
        Plan storage p = plans[planHash];
        require(msg.sender == p.borrower, "Borrower only");
        p.consented = true;
        activePlan[msg.sender] = planHash;
        emit Consented(planHash);
    }
    function revokeConsent() external { delete activePlan[msg.sender]; }
    function release(bytes32 planHash, uint256 amount, bytes32 evidenceHash) external onlySponsor {
        Plan storage p = plans[planHash];
        require(p.consented && activePlan[p.borrower] == planHash, "Active consent required");
        require(amount > 0 && amount <= p.remaining && amount <= address(this).balance, "Limit exceeded");
        require(evidenceHash != bytes32(0), "Evidence required");
        p.remaining -= amount;
        (bool ok,) = p.borrower.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Released(planHash, amount, evidenceHash);
    }
}

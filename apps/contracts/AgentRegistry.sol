// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice 最小 Agent 链上身份注册表
/// @dev 为 6 个已知 Agent (bull-1 ~ neut-2) 注册 TRON 地址。
///      部署后 owner 调用 6 次 register() 即可。
///      B.AI 8004 协议开通后，此合约可作为配置层被替换。
contract AgentRegistry {
    address public owner;
    mapping(string => address) public agents;

    event Registered(string indexed agentId, address indexed agentAddress);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function register(string calldata agentId, address agentAddress) external onlyOwner {
        require(agentAddress != address(0), "Invalid address");
        agents[agentId] = agentAddress;
        emit Registered(agentId, agentAddress);
    }

    function getAgent(string calldata agentId) external view returns (address) {
        return agents[agentId];
    }

    function agentCount() external pure returns (uint256) {
        // 固定 6 个 Agent
        return 6;
    }
}

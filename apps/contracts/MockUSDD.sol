// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.24;

/**
 * MockUSDD — Shasta 测试网用的最小 TRC-20（USDD 占位）。
 * 仅用于本地/测试网演示：部署者获得初始供应，可自由 mint 给测试钱包。
 * 生产环境应替换为真实 USDD 合约地址。
 */
contract MockUSDD {
    string public name = "Decentralized USD (Mock)";
    string public symbol = "USDD";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    address public owner;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        owner = msg.sender;
        _mint(msg.sender, initialSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "USDD: allowance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    /** 测试用：任何人可领取测试 USDD（仅 Mock）。 */
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "USDD: to=0");
        require(balanceOf[from] >= value, "USDD: balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
}

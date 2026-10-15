
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDAO {
    IERC20 public immutable governanceToken;
    uint256 public proposalCount;

    uint256 public constant VOTING_PERIOD = 1 minutes;

    struct Proposal {
        address targetContract;
        bytes payload;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed id,
        address indexed target,
        string description
    );

    event Voted(
        uint256 indexed id,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed id);

    constructor(address _governanceToken) {
        require(_governanceToken != address(0), "Invalid token");
        governanceToken = IERC20(_governanceToken);
    }

    function createProposal(
        address targetContract,
        bytes calldata payload,
        string calldata description
    ) external {
        require(
            governanceToken.balanceOf(msg.sender) > 0,
            "No governance tokens"
        );
        require(targetContract.code.length > 0, "Invalid target");
        require(payload.length >= 4, "Invalid payload");

        uint256 proposalId = proposalCount;
        proposalCount++;

        Proposal storage p = proposals[proposalId];
        p.targetContract = targetContract;
        p.payload = payload;
        p.deadline = block.timestamp + VOTING_PERIOD;

        emit ProposalCreated(
            proposalId,
            targetContract,
            description
        );
    }

    function vote(uint256 proposalId, bool support) external {
        require(proposalId < proposalCount, "Proposal not found");

        Proposal storage p = proposals[proposalId];

        require(block.timestamp < p.deadline, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.yesVotes += weight;
        } else {
            p.noVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external {
        require(proposalId < proposalCount, "Proposal not found");

        Proposal storage p = proposals[proposalId];

        require(block.timestamp >= p.deadline, "Voting ongoing");
        require(!p.executed, "Already executed");
        require(p.yesVotes > p.noVotes, "Proposal rejected");

        p.executed = true;

        (bool success, ) = p.targetContract.call(p.payload);
        require(success, "Execution failed");

        emit ProposalExecuted(proposalId);
    }
}

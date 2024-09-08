// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {FunctionsClient} from "@chainlink/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

error UnexpectedRequestID(bytes32);
error UnexpectedError(bytes);

enum BountyType {
    Artist,
    Track,
    Genre
}

struct BountyData {
    address creator;
    string name;
    BountyType bountyType;
    uint256 amount;
    uint256 startTime;
    uint256 endTime;
}

struct UserData {
    string spotifyId;
    string[5] topArtists;
    string[5] topGenre;
    string[10] topTrack;
    uint256 lastUpdated;
    mapping(uint256 bountyId => bool claimed) claimed;
}

contract ArtistBounty is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;
    uint256 public nextBountyId;
    bytes32 public donID;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    string public source;

    mapping(uint256 bountyId => BountyData) public bounties;
    mapping(address user => UserData) public userData;
    mapping(bytes32 requestId => address user) public requests;

    event UpdateProfile(address indexed user, uint256 timestamp);
    event Response(bytes32 indexed requestId, bytes response, bytes err);
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        BountyType indexed bountyType,
        uint256 amount,
        uint256 endTime
    );

    constructor(address router, address _usdcToken, uint64 _subscriptionId, bytes32 _donID)
        FunctionsClient(router)
        ConfirmedOwner(msg.sender)
    {
        subscriptionId = _subscriptionId;
        donID = _donID;
        usdcToken = IERC20(_usdcToken);
    }

    function updateProfile(address who, string memory spotifyId) external returns (bytes32 requestId) {
        UserData storage data = userData[who];
        bytes32 emptyInBytes32 = keccak256(abi.encodePacked(""));
        if (keccak256(abi.encodePacked(spotifyId)) == emptyInBytes32) {
            require(keccak256(abi.encodePacked(data.spotifyId)) != emptyInBytes32, "Spotify ID is required");
        } else {
            data.spotifyId = spotifyId;
        }

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        string[] memory args = new string[](1);
        args[0] = data.spotifyId;
        req.setArgs(args);
        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
        requests[requestId] = who;

        emit UpdateProfile(who, block.timestamp);
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (err.length != 0) {
            revert UnexpectedError(err);
        }

        address who = requests[requestId];
        if (who == address(0)) {
            revert UnexpectedRequestID(requestId);
        }

        if (response.length != 0) {
            UserData storage data = userData[who];
        }

        emit Response(requestId, response, err);
    }

    function createBounty(BountyType bountyType, string calldata name, uint256 amount, uint256 duration) external {
        require(amount > 0 && duration > 0, "Values must be greater than zero");
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 bountyId = nextBountyId++;
        uint256 endTime = block.timestamp + duration;

        bounties[bountyId] = BountyData({
            creator: msg.sender,
            name: name,
            bountyType: bountyType,
            amount: amount,
            startTime: block.timestamp,
            endTime: endTime
        });

        emit BountyCreated(bountyId, msg.sender, bountyType, amount, endTime);
    }

    function claimReward(uint256 bountyId) external {
        BountyData storage data = bounties[bountyId];
        require(block.timestamp > data.endTime, "Bounty is still active");

        // data.

        // uint256 reward = bounty.amount;
        // claimedRewards[msg.sender] += reward;

        // usdcToken.safeTransfer(msg.sender, reward);

        // emit BountyClaimed(bountyId, msg.sender, reward);
    }
}

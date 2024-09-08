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
    uint256 noOfWinners;
    uint256 noOfClaimers;
}

struct UserData {
    string spotifyId;
    string[5] topArtists;
    string[5] topGenres;
    string[10] topTracks;
    uint256 lastUpdated;
}

interface ISPHook {
    function didReceiveAttestation(address attester, uint64 schemaId, uint64 attestationId, bytes calldata extraData)
        external
        payable;

    function didReceiveAttestation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        IERC20 resolverFeeERC20Token,
        uint256 resolverFeeERC20Amount,
        bytes calldata extraData
    ) external;

    function didReceiveRevocation(address attester, uint64 schemaId, uint64 attestationId, bytes calldata extraData)
        external
        payable;

    function didReceiveRevocation(
        address attester,
        uint64 schemaId,
        uint64 attestationId,
        IERC20 resolverFeeERC20Token,
        uint256 resolverFeeERC20Amount,
        bytes calldata extraData
    ) external;
}

contract WhitelistMananger {
    address owner_;
    mapping(address attester => bool allowed) public whitelist;

    constructor() {
        owner_ = msg.sender;
    }

    function setWhitelist(address attester, bool allowed) external {
        require(msg.sender == owner_);
        whitelist[attester] = allowed;
    }

    function _checkAttesterWhitelistStatus(address attester) internal view {
        // solhint-disable-next-line custom-errors
        require(whitelist[attester]);
    }
}

contract ArtistBounty is ISPHook, WhitelistMananger, FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;
    uint256 public nextBountyId;
    bytes32 public donID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    uint64 public subscriptionId = 3466;
    uint32 public gasLimit = 300000;
    string public source = 'const spotifyApiUrl = "https://api.spotify.com/v1";'
        "async function getTopArtists(spotifyAccountId) {" 'const clientId = "763cf123f695453587e85a6a1349066f";'
        'const clientSecret = "dde1e833e77e44f396a302ba14b8fa58";'
        "const accessToken = await getSpotifyAccessToken(clientId, clientSecret);"
        "const topArtists = await fetchTopArtists(accessToken, spotifyAccountId);"
        "const result = formatResultString(spotifyAccountId, topArtists);" "return result;" "}"
        "async function getSpotifyAccessToken(clientId, clientSecret) {"
        "const response = await Functions.makeHttpRequest({" 'url: "https://accounts.spotify.com/api/token",'
        'method: "POST",' "headers: {" '"Content-Type": "application/x-www-form-urlencoded",'
        'Authorization: "Basic " + btoa(clientId + ":" + clientSecret),' "}," 'data: "grant_type=client_credentials",'
        "});" "if (response.error) {" 'throw Error("Failed to get access token");' "}"
        "return response.data.access_token;" "}" "async function fetchTopArtists(accessToken, userId) {"
        "const response = await Functions.makeHttpRequest({" "url: `${spotifyApiUrl}/me/top/artists`," 'method: "GET",'
        "headers: {" "Authorization: `Bearer ${accessToken}`," "}," "params: {" 'time_range: "short_term",' "limit: 5,"
        "}," "});" "if (response.error) {" 'throw Error("Failed to fetch top artists");' "}"
        "return response.data.items.map((artist) => artist.id);" "}" "function formatResultString(userId, artistIds) {"
        'return [userId, ...artistIds].join(",");' "}" "return getTopArtists(args[0]);";

    mapping(uint256 bountyId => BountyData) public bounties;
    mapping(address user => UserData) public userData;

    mapping(address user => mapping(uint256 bountyId => bool claimed)) public claimed;
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
    event BountyClaimed(uint256 indexed bountyId, address indexed who, uint256 reward);

    constructor(address _usdcToken)
        FunctionsClient(0xb83E47C2bC239B3bf370bc41e1459A34b41238D0)
        ConfirmedOwner(msg.sender)
    {
        usdcToken = IERC20(_usdcToken);
    }

    function updateProfile(address who, string memory spotifyId) external returns (bytes32 requestId) {
        UserData memory data = userData[who];
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
            uint256 offset = 0;

            for (uint256 i; i < 5; ++i) {
                uint256 length;
                assembly {
                    length := mload(add(response, add(32, offset)))
                }
                bytes memory strBytes = new bytes(length);
                for (uint256 j = 0; j < length; j++) {
                    strBytes[j] = response[offset + j + 32];
                }
                data.topArtists[i] = string(strBytes);
                offset += length + 32;
            }
        }

        emit Response(requestId, response, err);
    }

    function createBounty(
        BountyType bountyType,
        string calldata name,
        uint256 amount,
        uint256 noOfWinners,
        uint256 duration
    ) external {
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
            endTime: endTime,
            noOfWinners: noOfWinners,
            noOfClaimers: 0
        });

        emit BountyCreated(bountyId, msg.sender, bountyType, amount, endTime);
    }

    function claimReward(uint256 bountyId) external {
        BountyData memory data = bounties[bountyId];
        require(block.timestamp > data.endTime, "Bounty is still active");
        require(!claimed[msg.sender][bountyId], "Already claimed bounty");
        require(data.noOfClaimers < data.noOfWinners, "Exhausted");

        bool winner;

        for (uint256 i; i < 5; i++) {
            if (
                keccak256(abi.encodePacked(userData[msg.sender].topArtists[i]))
                    == keccak256(abi.encodePacked(data.name))
            ) {
                winner = true;
            }
        }

        if (winner) {
            claimed[msg.sender][bountyId] = true;
            bounties[bountyId].noOfClaimers++;
            uint256 reward = data.amount / data.noOfWinners;

            usdcToken.safeTransfer(msg.sender, reward);
            emit BountyClaimed(bountyId, msg.sender, reward);
        }
    }

    function didReceiveAttestation(
        address attester,
        uint64, // schemaId
        uint64, // attestationId
        bytes calldata // extraData
    ) external payable {
        _checkAttesterWhitelistStatus(attester);
    }

    function didReceiveAttestation(
        address attester,
        uint64, // schemaId
        uint64, // attestationId
        IERC20, // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata // extraData
    ) external view {
        _checkAttesterWhitelistStatus(attester);
    }

    function didReceiveRevocation(
        address attester,
        uint64, // schemaId
        uint64, // attestationId
        bytes calldata // extraData
    ) external payable {
        _checkAttesterWhitelistStatus(attester);
    }

    function didReceiveRevocation(
        address attester,
        uint64, // schemaId
        uint64, // attestationId
        IERC20, // resolverFeeERC20Token
        uint256, // resolverFeeERC20Amount
        bytes calldata // extraData
    ) external view {
        _checkAttesterWhitelistStatus(attester);
    }
}

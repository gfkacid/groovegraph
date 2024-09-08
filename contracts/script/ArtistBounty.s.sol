// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ArtistBounty} from "../src/ArtistBounty.sol";

contract MyScript is Script {
    ArtistBounty public artistBounty;

    function setUp() public {}

    // function run() public {
    //     vm.startBroadcast();

    //     counter = new ArtistBounty();

    //     vm.stopBroadcast();
    // }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {Exec} from "forge-exec/Exec.sol";

address constant FirstContract = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

contract ExecTest is Test {
    function setUp() public {
        string[] memory args = new string[](2);
        args[0] = "tsx";
        args[1] = "./example.ts";
        bytes memory test = Exec.execute("npx", args, false);
        (address addr1, address addr2, address addr3) = abi.decode(
            test,
            (address, address, address)
        );

        console.log("----");
        console.log(addr1, addr2, addr3);
        console.logBytes(test);
        console.log("----");
    }

    function testDeplyment() public view {
        bytes memory code = FirstContract.code;
        assert(code.length > 0);
    }

    function testDeplymentAgain() public view {
        bytes memory code = FirstContract.code;
        assert(code.length > 0);
    }

    function testDeplymentAgainAndAgain() public view {
        bytes memory code = FirstContract.code;
        assert(code.length > 0);
    }

    function testDeplymentAgainAndAgainAndAgain() public view {
        bytes memory code = FirstContract.code;
        assert(code.length > 0);
    }
}

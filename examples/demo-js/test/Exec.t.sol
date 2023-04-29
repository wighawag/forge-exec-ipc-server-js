// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {Exec} from "forge-exec/Exec.sol";
import {Counter} from 'src/Counter.sol';

address constant FirstContract = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

contract ExecTest is Test {
    Counter counter;
    function setUp() public {
        string[] memory args = new string[](1);
        args[0] = "./example.js";
        bytes memory test = Exec.execute("node", args);
        (address addr1, address addr2, address addr3) = abi.decode(
            test,
            (address, address, address)
        );

        counter = Counter(addr1);

        console.log("----");
        console.log(addr1, addr2, addr3);
        console.logBytes(test);
        console.log("----");
    }

    function testDeplyment() public {
        bytes memory code = FirstContract.code;
        assert(code.length > 0);
        assertEq(counter.number(), 42);
    }

    function testDeplymentAgain() public  {
        bytes memory code = FirstContract.code;
        assertGt(code.length, 0);
    }

    function testDeplymentAgainAndAgain() public {
        bytes memory code = FirstContract.code;
        assertGt(code.length, 0);
    }

    function testDeplymentAgainAndAgainAndAgain() public {
        bytes memory code = FirstContract.code;
        assertGt(code.length, 0);
    }
}

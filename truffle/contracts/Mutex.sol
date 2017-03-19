pragma solidity ^0.4.4;
contract Mutex {
    bool locked;
    modifier noReentrancy() {
        if (locked) throw;
        locked = true;
        _;
        locked = false;
    }
}

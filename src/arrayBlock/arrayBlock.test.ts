

import extractBlock from "./extractBlock"

// 12345678
// 23456789
// 34567890
// 01234567

const source = new Uint8Array("12345678234567893456789001234567".split('').map(parseInt))

test('Copying 2x2 block',()=> {
    expect(extractBlock(2,2,2,2,source,8)).toEqual(new Uint8Array([5,6,2,3]))
})


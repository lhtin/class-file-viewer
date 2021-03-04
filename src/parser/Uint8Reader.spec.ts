import {Uint8Reader} from "./Uint8Reader";

describe('Uint8Reader', () => {
  const u = Uint8Array.of(
    0, 0, 0, 0, /* for eat and align */
    6, 167, /* for u1 */
    78, /* for readU1 */
    78, 89, /* for readU2 */
    12, 34, 89, 12, /* for readU4 */
    255, 255, 255, 255, /* for readU4 */
    98, 12, 67, 23, 98, 28, 45, 68, /* for readU8 */
    255, /* for readS1 */
    255, 255, /* for readS2 */
    255, 255, 255, 255, /* for readS4 */
    72, 101, 108, 108, 111, 87, 111, 114, 108, 100, /* "HelloWorld" for readUtf8, just ascii now */
  )
  const reader = new Uint8Reader(u);
  it('u1ToHex', () => {
    expect(reader.u1ToHex(0)).toEqual('00')
    expect(reader.u1ToHex(15)).toEqual('0F')
    expect(reader.u1ToHex(170)).toEqual('AA')
  })
  it('eat', () => {
    const offset = reader.getOffset()
    reader.eat(1)
    expect(reader.getOffset()).toEqual(offset + 1)
  })
  it('align', () => {
    reader.align(reader.getOffset(), 4)
    expect(reader.getOffset()).toEqual(4)
  })
  it('u1', () => {
    const offset = reader.getOffset()
    expect(reader.u1()).toEqual(6)
    expect(reader.getOffset()).toEqual(offset + 1)
    expect(reader.u1()).toEqual(167)
    expect(reader.getOffset()).toEqual(offset + 2)
  })
  it('readU1', () => {
    const offset1 = reader.getOffset()
    expect(reader.readU1()).toEqual({
      offset: offset1,
      bytes: 1,
      value: 78
    })
    expect(reader.getOffset()).toEqual(offset1 + 1)
  })
  it('readU2', () => {
    const offset1 = reader.getOffset()
    expect(reader.readU2()).toEqual({
      offset: offset1,
      bytes: 2,
      value: 20057
    })
    expect(reader.getOffset()).toEqual(offset1 + 2)
  })
  it('readU4', () => {
    const offset1 = reader.getOffset()
    expect(reader.readU4()).toEqual({
      offset: offset1,
      bytes: 4,
      value: 203577612,
    })
    expect(reader.getOffset()).toEqual(offset1 + 4)
    expect(reader.readU4()).toEqual({
      offset: offset1 + 4,
      bytes: 4,
      value: 4294967295,
    })
    expect(reader.getOffset()).toEqual(offset1 + 8)
  })
  it('readU8', () => {
    const offset1 = reader.getOffset()
    expect(reader.readU8()).toEqual({
      offset: offset1,
      bytes: 8,
      value: 7065095683146788164n,
    })
    expect(reader.getOffset()).toEqual(offset1 + 8)
  })
  it('readS1', () => {
    const offset1 = reader.getOffset()
    expect(reader.readS1()).toEqual({
      offset: offset1,
      bytes: 1,
      value: -1
    })
    expect(reader.getOffset()).toEqual(offset1 + 1)
  })
  it('readS2', () => {
    const offset1 = reader.getOffset()
    expect(reader.readS2()).toEqual({
      offset: offset1,
      bytes: 2,
      value: -1
    })
    expect(reader.getOffset()).toEqual(offset1 + 2)
  })
  it('readS4', () => {
    const offset1 = reader.getOffset()
    expect(reader.readS4()).toEqual({
      offset: offset1,
      bytes: 4,
      value: -1
    })
    expect(reader.getOffset()).toEqual(offset1 + 4)
  })
  it('readUtf8', () => {
    const offset1 = reader.getOffset()
    expect(reader.readUtf8(10)).toEqual({
      offset: offset1,
      bytes: 10,
      value: -1,
      name: 'HelloWorld'
    })
    expect(reader.getOffset()).toEqual(offset1 + 10)
  })

})

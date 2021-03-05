import {UItem, UItemBigInt} from "./typing";

export class Uint8Reader {
  private readonly u: Uint8Array
  private offset: number
  private readonly maxOffset: number
  constructor (u: Uint8Array) {
    this.u = u
    this.offset = 0
    this.maxOffset = u.length - 1
  }
  getOffset () {
    return this.offset
  }
  getU() {
    return this.u
  }
  align (offset: number, alignSize: number) {
    const padding = offset % alignSize
    if (padding > 0) {
      // 消耗对齐用的字节
      for (let i = padding + 1; i <= alignSize; i += 1) {
        this.readU1()
      }
    }
  }
  u1 () {
    let r = this.u[this.offset]
    this.offset += 1
    this.checkOffset()
    return r
  }
  readU1 () : UItem {
    return {
      offset: this.offset,
      bytes: 1,
      value: Number(this.readU(1))
    }
  }
  readU2 () : UItem {
    return {
      offset: this.offset,
      bytes: 2,
      value: Number(this.readU(2))
    }
  }
  readU4 ()  : UItem{
    return {
      offset: this.offset,
      bytes: 4,
      value: Number(this.readU(4))
    }
  }
  readU8 () : UItemBigInt {
    return {
      offset: this.offset,
      bytes: 8,
      value: this.readU(8).toString(),
    }
  }
  readS1 () : UItem {
    return {
      offset: this.offset,
      bytes: 1,
      value: Number(BigInt.asIntN(8, this.readU(1)))
    }
  }
  readS2 () : UItem {
    return {
      offset: this.offset,
      bytes: 2,
      value:  Number(BigInt.asIntN(16, this.readU(2)))
    }
  }
  readS4 () : UItem {
    return {
      offset: this.offset,
      bytes: 4,
      value: Number(BigInt.asIntN(32, this.readU(4)))
    }
  }
  readUtf8 (bytes: number): UItem {
    const offset = this.offset
    let r = ''
    for (let i = 0; i < bytes; i += 1) {
      const x = this.u1()
      let cp: number
      // FIXME 还没有完全解析
      if (x >= 0xE0) {
        const y = this.u1()
        const z = this.u1()
        cp = ((x & 0xf) << 12) + ((y & 0x3f) << 6) + (z & 0x3f)
      } else if (x >= 0xC0) {
        const y = this.u1()
        cp = ((x & 0x1f) << 6) + (y & 0x3f)
      } else if (x >= 0x01 && x <= 0x7F) {
        cp = x
      } else {
        cp = 0
      }
      r += String.fromCodePoint(cp)
    }
    return {
      offset,
      bytes,
      value: -1,
      name: r,
    }
  }
  readF4() {
    const data: UItem = {
      offset: this.getOffset(),
      bytes: 4,
      value: -1,
    }
    const buffer = new ArrayBuffer(4);
    const dataView = new DataView(buffer)
    dataView.setUint8(0, this.u1())
    dataView.setUint8(1, this.u1())
    dataView.setUint8(2, this.u1())
    dataView.setUint8(3, this.u1())
    data.value = dataView.getFloat32(0, false)
    // console.log(data)
    return data
  }
  readF8() {
    const data: UItem = {
      offset: this.getOffset(),
      bytes: 8,
      value: -1,
    }
    const buffer = new ArrayBuffer(8);
    const dataView = new DataView(buffer)
    dataView.setUint8(0, this.u1())
    dataView.setUint8(1, this.u1())
    dataView.setUint8(2, this.u1())
    dataView.setUint8(3, this.u1())
    dataView.setUint8(4, this.u1())
    dataView.setUint8(5, this.u1())
    dataView.setUint8(6, this.u1())
    dataView.setUint8(7, this.u1())
    data.value = dataView.getFloat64(0, false)
    return data
  }
  eat(bytes: number) {
    this.offset += bytes
    this.checkOffset()
  }
  u1ToHex (u1: number): string {
    return u1.toString(16).padStart(2, '0').toUpperCase()
  }
  private checkOffset () {
    if (this.offset > this.maxOffset + 1) {
      throw new Error('Uint8 EOF')
    }
  }
  private readU (bytes: number) : bigint {
    const bits = 8n
    let value = 0n
    for (let i = 0; i < bytes; i += 1) {
      value = (value << bits) + BigInt(this.u1())
    }
    return value;
  }
}

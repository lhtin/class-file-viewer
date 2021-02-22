import {UItem} from "./typing";

export class Uint8Reader {
  private readonly u: Uint8Array
  private offset: number
  private maxOffset: number
  constructor (u: Uint8Array) {
    this.u = u
    this.offset = 0
    this.maxOffset = u.length - 1
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
      value: 0,
      name: r,
    }
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
  getOffset () {
    return this.offset
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
      value: this.readU(1)
    }
  }
  readU2 () : UItem {
    return {
      offset: this.offset,
      bytes: 2,
      value: this.readU(2)
    }
  }
  readU4 ()  : UItem{
    return {
      offset: this.offset,
      bytes: 4,
      value: this.readU(4)
    }
  }
  readU8 () : UItem {
    return {
      offset: this.offset,
      bytes: 8,
      value: this.readU(8),
    }
  }
  readS1 () : UItem {
    return {
      offset: this.offset,
      bytes: 1,
      value: Int8Array.of(this.readU(1))[0]
    }
  }
  readS2 () : UItem {
    return {
      offset: this.offset,
      bytes: 2,
      value:  Int16Array.of(this.readU(2))[0]
    }
  }
  readS4 () : UItem {
    return {
      offset: this.offset,
      bytes: 4,
      value: Int32Array.of(this.readU(4))[0]
    }
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
  private readU (bytes: number) : number {
    const bits = 8
    let value = 0
    for (let i = 0; i < bytes; i += 1) {
      value = (value << (bits * i)) + this.u1()
    }
    return value;
  }
}

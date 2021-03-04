import {Utils} from './Utils'
import {CLASS_ACCESS_FLAGS} from "./constants";

describe('Utils', () => {
  it('getAccessFlagsDesc', () => {
    expect(Utils.getAccessFlagsDesc(0x1001, CLASS_ACCESS_FLAGS)).toEqual('public synthetic')
  })
  it('parseClassType', () => {
    expect(Utils.parseClassType('java/lang/Object')).toEqual('java.lang.Object')
  })
  it('parseDescriptor', () => {
    expect(Utils.parseDescriptor('Lxxx/xxx/xxx;', 'bbb')).toEqual('xxx.xxx.xxx bbb')
    expect(Utils.parseDescriptor('(BCDFIJZ)V', 'method')).toEqual('void method(byte, char, double, float, int, long, boolean)')
  })
})

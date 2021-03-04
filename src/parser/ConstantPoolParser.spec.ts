import { ConstantPoolParser } from './ConstantPoolParser'
import {Uint8Reader} from "./Uint8Reader";
import {CONSTANT_TAG} from "./constants";

const str2ascii = (str: string) => str.split('').map((item) => item.charCodeAt(0))
const utf8 = (str: string) => {
  const len = str.length
  if (len > 255) {
    throw new Error('Utf8字符串过长')
  }
  return [
    1, 0, len,
    ...str2ascii(str)
  ]
}

const u = Uint8Array.of(
  0, 25, /* constant_pool_count */
  /* 1: Utf8(1) "HelloWorld" */
  ...utf8('HelloWorld'),
  /* 2: Integer(3) */
  3,
  12, 34, 56, 78,
  /* 3: Float(4) */
  4,
  1, 1, 1, 1,
  /* 4: Long(5) */
  5,
  1, 1, 1, 1,
  1, 1, 1, 1,
  /* 6: Double(6) */
  6,
  1, 1, 1, 1,
  1, 1, 1, 1,
  /* 8: Class(7) */
  7, 0, 1,
  /* 9: String(8) */
  8, 0, 1,
  /* 10: Fieldref(9) HelloWorld.field: int */
  9,
  0, 8,
  0, 13,
  /* 11: Methodref(10) */
  10,
  0, 8,
  0, 22,
  /* 12: InterfaceMethodref(11) */
  11,
  0, 8,
  0, 22,
  /* 13: NameAndType(12) */
  12,
  0, 20,
  0, 21,
  /* 14: MethodHandle(15) */
  15, 1, 0, 10,
  /* 15: MethodType(16) */
  16, 0, 24,
  /* 16: Dynamic(17) */
  17, 0, 0, 0, 13,
  /* 17: InvokeDynamic(18) */
  18, 0, 1, 0, 22,
  /* 18: Module(19) */
  19, 0, 1,
  /* 19: Package(20) */
  20, 0, 1,
  /* 20: Utf8 name */
  ...utf8('field'),
  /* 21: Utf8 descriptor */
  ...utf8('I'),
  /* 22: NameAndType(12) */
  12,
  0, 23,
  0, 24,
  /* 23: Utf8 name */
  ...utf8('method'),
  /* 24: Utf8 descriptor */
  ...utf8('(LHelloWorld;)V')
)

describe('ConstantPoolParser', () => {
  const reader = new Uint8Reader(u)
  const constantParser = new ConstantPoolParser(reader)
  it('constant_pool_count', () => {
    expect(reader.readU2()).toEqual({
      offset: 0,
      bytes: 2,
      value: 25,
    })
  })
  it('parseConstant Utf8', () => {
    expect(constantParser.parseConstant(1)).toMatchObject({
        tag: { value: CONSTANT_TAG.CONSTANT_Utf8, name: 'Utf8' },
        length: { value: 10 },
        bytes: { value: -1, name: 'HelloWorld' }
      }
    )
  })
  it('parseConstant Integer', () => {
    expect(constantParser.parseConstant(2)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Integer, name: 'Integer' },
      bytes: { value: 203569230 },
    })
  })
  it('parseConstant Float', () => {
    expect(constantParser.parseConstant(3)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Float, name: 'Float' },
      bytes: { value: 16843009, },
    })
  })
  it('parseConstant Long', () => {
    expect(constantParser.parseConstant(4)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Long, name: 'Long' },
      bytes: { value: 72340172838076673n, },
    })
  })
  it('parseConstant Double', () => {
    expect(constantParser.parseConstant(6)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Double, name: 'Double' },
      bytes: { value: 72340172838076673n, },
    })
  })
  it('parseConstant Class', () => {
    expect(constantParser.parseConstant(8)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Class, name: 'Class' },
      name_index: { value: 1 },
    })
  })
  it('parseConstant String', () => {
    expect(constantParser.parseConstant(9)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_String, name: 'String' },
      string_index: { value: 1 },
    })
  })
  it('parseConstant Fieldref', () => {
    expect(constantParser.parseConstant(10)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Fieldref, name: 'Fieldref' },
      class_index: { value: 8 },
      name_and_type_index: { value: 13 }
    })
  })
  it('parseConstant Methodref', () => {
    expect(constantParser.parseConstant(11)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Methodref, name: 'Methodref' },
      class_index: { value: 8 },
      name_and_type_index: { value: 22 }
    })
  })
  it('parseConstant InterfaceMethodref', () => {
    expect(constantParser.parseConstant(12)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_InterfaceMethodref, name: 'InterfaceMethodref' },
      class_index: { value: 8 },
      name_and_type_index: { value: 22 }
    })
  })
  it('parseConstant NameAndType', () => {
    expect(constantParser.parseConstant(13)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_NameAndType, name: 'NameAndType' },
      name_index: { value: 20 },
      descriptor_index: { value: 21 }
    })
  })
  it('parseConstant MethodHandle', () => {
    expect(constantParser.parseConstant(14)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_MethodHandle, name: 'MethodHandle' },
      reference_kind: { value: 1, name: 'REF_getField' },
      reference_index: { value: 10 }
    })
  })
  it('parseConstant MethodType', () => {
    expect(constantParser.parseConstant(15)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_MethodType, name: 'MethodType' },
      descriptor_index: { value: 24 },
    })
  })
  it('parseConstant Dynamic', () => {
    expect(constantParser.parseConstant(16)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Dynamic, name: 'Dynamic' },
      bootstrap_method_attr_index: { value: 0 },
      name_and_type_index: { value: 13 },
    })
  })
  it('parseConstant InvokeDynamic', () => {
    expect(constantParser.parseConstant(17)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_InvokeDynamic, name: 'InvokeDynamic' },
      bootstrap_method_attr_index: { value: 1 },
      name_and_type_index: { value: 22 },
    })
  })
  it('parseConstant Module', () => {
    expect(constantParser.parseConstant(18)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Module, name: 'Module' },
      name_index: { value: 1 },
    })
  })
  it('parseConstant Package', () => {
    expect(constantParser.parseConstant(19)).toMatchObject({
      tag: { value: CONSTANT_TAG.CONSTANT_Package, name: 'Package' },
      name_index: { value: 1 },
    })
  })

  it('constantPool resolved', () => {
    const reader = new Uint8Reader(u)
    const constantParser = new ConstantPoolParser(reader)
    const data = constantParser.parseConstantPool()
    expect(data.constant_pool_count).toMatchObject({
      value: 25
    })
    expect(data.constant_pool).toEqual([
      {
        index: 1,
        tag: { offset: 2, bytes: 1, value: 1, name: 'Utf8' },
        length: { offset: 3, bytes: 2, value: 10 },
        bytes: { offset: 5, bytes: 10, value: -1, name: 'HelloWorld' },
        name: 'HelloWorld'
      },
      {
        index: 2,
        tag: { offset: 15, bytes: 1, value: 3, name: 'Integer' },
        bytes: { offset: 16, bytes: 4, value: 203569230 },
        name: '203569230'
      },
      {
        index: 3,
        tag: { offset: 20, bytes: 1, value: 4, name: 'Float' },
        bytes: { offset: 21, bytes: 4, value: 16843009 },
        name: '16843009'
      },
      {
        index: 4,
        tag: { offset: 25, bytes: 1, value: 5, name: 'Long' },
        bytes: { offset: 26, bytes: 8, value: 72340172838076673n },
        name: '72340172838076673'
      },
      {
        index: 6,
        tag: { offset: 34, bytes: 1, value: 6, name: 'Double' },
        bytes: { offset: 35, bytes: 8, value: 72340172838076673n },
        name: '72340172838076673'
      },
      {
        index: 8,
        tag: { offset: 43, bytes: 1, value: 7, name: 'Class' },
        name_index: { offset: 44, bytes: 2, value: 1 },
        name: 'HelloWorld'
      },
      {
        index: 9,
        tag: { offset: 46, bytes: 1, value: 8, name: 'String' },
        string_index: { offset: 47, bytes: 2, value: 1 },
        name: 'HelloWorld'
      },
      {
        index: 10,
        tag: { offset: 49, bytes: 1, value: 9, name: 'Fieldref' },
        class_index: { offset: 50, bytes: 2, value: 8 },
        name_and_type_index: { offset: 52, bytes: 2, value: 13 },
        name: 'int HelloWorld.field'
      },
      {
        index: 11,
        tag: { offset: 54, bytes: 1, value: 10, name: 'Methodref' },
        class_index: { offset: 55, bytes: 2, value: 8 },
        name_and_type_index: { offset: 57, bytes: 2, value: 22 },
        name: 'void HelloWorld.method(HelloWorld)'
      },
      {
        index: 12,
        tag: { offset: 59, bytes: 1, value: 11, name: 'InterfaceMethodref' },
        class_index: { offset: 60, bytes: 2, value: 8 },
        name_and_type_index: { offset: 62, bytes: 2, value: 22 },
        name: 'void HelloWorld.method(HelloWorld)'
      },
      {
        index: 13,
        tag: { offset: 64, bytes: 1, value: 12, name: 'NameAndType' },
        name_index: { offset: 65, bytes: 2, value: 20 },
        descriptor_index: { offset: 67, bytes: 2, value: 21 },
        name: 'int field'
      },
      {
        index: 14,
        tag: { offset: 69, bytes: 1, value: 15, name: 'MethodHandle' },
        reference_kind: { offset: 70, bytes: 1, value: 1, name: 'REF_getField' },
        reference_index: { offset: 71, bytes: 2, value: 10 },
        name: 'REF_getField int HelloWorld.field'
      },
      {
        index: 15,
        tag: { offset: 73, bytes: 1, value: 16, name: 'MethodType' },
        descriptor_index: { offset: 74, bytes: 2, value: 24 },
        name: 'void (HelloWorld)'
      },
      {
        index: 16,
        tag: { offset: 76, bytes: 1, value: 17, name: 'Dynamic' },
        bootstrap_method_attr_index: { offset: 77, bytes: 2, value: 0 },
        name_and_type_index: { offset: 79, bytes: 2, value: 13 },
        name: 'bootstrap_0: int field'
      },
      {
        index: 17,
        tag: { offset: 81, bytes: 1, value: 18, name: 'InvokeDynamic' },
        bootstrap_method_attr_index: { offset: 82, bytes: 2, value: 1 },
        name_and_type_index: { offset: 84, bytes: 2, value: 22 },
        name: 'bootstrap_1: void method(HelloWorld)'
      },
      {
        index: 18,
        tag: { offset: 86, bytes: 1, value: 19, name: 'Module' },
        name_index: { offset: 87, bytes: 2, value: 1 },
        name: 'HelloWorld'
      },
      {
        index: 19,
        tag: { offset: 89, bytes: 1, value: 20, name: 'Package' },
        name_index: { offset: 90, bytes: 2, value: 1 },
        name: 'HelloWorld'
      },
      {
        index: 20,
        tag: { offset: 92, bytes: 1, value: 1, name: 'Utf8' },
        length: { offset: 93, bytes: 2, value: 5 },
        bytes: { offset: 95, bytes: 5, value: -1, name: 'field' },
        name: 'field'
      },
      {
        index: 21,
        tag: { offset: 100, bytes: 1, value: 1, name: 'Utf8' },
        length: { offset: 101, bytes: 2, value: 1 },
        bytes: { offset: 103, bytes: 1, value: -1, name: 'I' },
        name: 'I'
      },
      {
        index: 22,
        tag: { offset: 104, bytes: 1, value: 12, name: 'NameAndType' },
        name_index: { offset: 105, bytes: 2, value: 23 },
        descriptor_index: { offset: 107, bytes: 2, value: 24 },
        name: 'void method(HelloWorld)'
      },
      {
        index: 23,
        tag: { offset: 109, bytes: 1, value: 1, name: 'Utf8' },
        length: { offset: 110, bytes: 2, value: 6 },
        bytes: { offset: 112, bytes: 6, value: -1, name: 'method' },
        name: 'method'
      },
      {
        index: 24,
        tag: { offset: 118, bytes: 1, value: 1, name: 'Utf8' },
        length: { offset: 119, bytes: 2, value: 15 },
        bytes: { offset: 121, bytes: 15, value: -1, name: '(LHelloWorld;)V' },
        name: '(LHelloWorld;)V'
      }
    ])
  })
})

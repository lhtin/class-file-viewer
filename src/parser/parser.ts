import { BYTE_CODES, OPERAND_TYPES } from './bytecodes'
import {
  CLASS_ACCESS_FLAGS,
  CONSTANT_KIND, CONSTANT_TAG,
  FIELD_ACCESS_FLAGS,
  METHOD_ACCESS_FLAGS,
  REFERENCE_KIND
} from './constants'
import { Uint8Reader } from './Uint8Reader'
import {AccessFlags, ConstantInfo, FlagItem, UItem} from "./typing";

class Parser {
  private reader: Uint8Reader
  private constant_pool: any
  constructor (uint8Array: Uint8Array) {
    this.reader = new Uint8Reader(uint8Array)
  }

  getData () {
    return this.parse()
  }

  getAccessFlagsDesc (flags: number, flagMap: Record<number, FlagItem>) {
    return Object.values(flagMap)
      .filter((item) => (item.value & flags) > 0)
      .map((item) => item.name)
      .join(' ')
  }

  getName (index: number) : string {
    if (!this.constant_pool) {
      return 'pending'
    }
    const item = this.constant_pool[index]
    if (!item) {
      throw new Error('constant_pool_index ' + index)
    }
    switch (item.tag.value) {
      case CONSTANT_TAG.CONSTANT_Class:
      case CONSTANT_TAG.CONSTANT_Module:
      case CONSTANT_TAG.CONSTANT_Package:
        return this.getName(item.name_index.value)
      case CONSTANT_TAG.CONSTANT_Fieldref:
      case CONSTANT_TAG.CONSTANT_Methodref:
      case CONSTANT_TAG.CONSTANT_InterfaceMethodref:
        return this.getName(item.class_index.value) + '.' +
          this.getName(item.name_and_type_index.value)
      case CONSTANT_TAG.CONSTANT_NameAndType:
        return this.getName(item.name_index.value) + ':' +
          this.getName(item.descriptor_index.value)
      case CONSTANT_TAG.CONSTANT_String:
        return this.getName(item.string_index.value)
      case CONSTANT_TAG.CONSTANT_Integer:
      case CONSTANT_TAG.CONSTANT_Float:
      case CONSTANT_TAG.CONSTANT_Long:
      case CONSTANT_TAG.CONSTANT_Double:
        return item.bytes.value
      case CONSTANT_TAG.CONSTANT_Utf8:
        return item.bytes.name
      case CONSTANT_TAG.CONSTANT_MethodHandle:
        return item.reference_kind + ' ' +
          this.getName(item.reference_index.value)
      case CONSTANT_TAG.CONSTANT_MethodType:
        return this.getName(item.descriptor_index.value)
      case CONSTANT_TAG.CONSTANT_Dynamic:
      case CONSTANT_TAG.CONSTANT_InvokeDynamic:
        return 'bootstrap_method_attr_index: ' +
          item.bootstrap_method_attr_index.value + ', ' +
          this.getName(item.name_and_type_index.value)
      default:
        return 'unknown tag'
    }
  }

  parseBranchOffset2 (offset: number) {
    const data = this.reader.readS2()
    data.value += offset
    return data
  }

  parseBranchOffset4 (offset: number) {
    const data = this.reader.readS4()
    data.value += offset
    return data
  }

  parseOperand (operandType: string, opcodeOffset: number) {
    let operand
    switch (operandType) {
      case OPERAND_TYPES.unsigned1:
        operand = this.reader.readU1()
        break
      case OPERAND_TYPES.unsigned2:
        operand = this.reader.readU2()
        break
      case OPERAND_TYPES.unsigned4:
        operand = this.reader.readU4()
        break
      case OPERAND_TYPES.signed1:
        operand = this.reader.readS1()
        break
      case OPERAND_TYPES.signed2:
        operand = this.reader.readS2()
        break
      case OPERAND_TYPES.signed4:
        operand = this.reader.readS4()
        break
      case OPERAND_TYPES.constant_index1:
        operand = this.parseIndex1()
        break
      case OPERAND_TYPES.constant_index2:
        operand = this.parseIndex2()
        break
      case OPERAND_TYPES.local_index1:
        operand = this.parseLocal1()
        break
      case OPERAND_TYPES.local_index2:
        operand = this.parseLocal2()
        break
      case OPERAND_TYPES.branch_offset2:
        operand = this.parseBranchOffset2(opcodeOffset)
        break
      case OPERAND_TYPES.branch_offset4:
        operand = this.parseBranchOffset4(opcodeOffset)
        break
      default:
        throw new Error('unknown operand type: ' + operandType)
    }
    operand.type = operandType
    return operand
  }

  parseMagic () {
    return {
      offset: this.reader.getOffset(),
      bytes: 4,
      value: '0x' +
        this.reader.u1ToHex(this.reader.u1()) +
        this.reader.u1ToHex(this.reader.u1()) +
        this.reader.u1ToHex(this.reader.u1()) +
        this.reader.u1ToHex(this.reader.u1()),
    }
  }

  parseVersion () {
    return {
      minor: this.reader.readU2(),
      major: this.reader.readU2(),
    }
  }

  parseCount () {
    return this.reader.readU2()
  }

  parseTag () {
    const tag = this.reader.readU1()
    // @ts-ignore
    tag.name = CONSTANT_KIND[tag.value].name
    return tag
  }

  parseInteger () {
    return this.reader.readU4()
  }

  parseLong () {
    return this.reader.readU8()
  }

  parseFloat () {
    return this.reader.readU4()
  }

  parseDouble () {
    return this.reader.readU8()
  }

  parseReferenceKind () {
    const data = this.reader.readU1()
    // @ts-ignore
    data.name = REFERENCE_KIND[data.value].name
    return data
  }

  parseConstantPool (count: number) {
    let result: Array<ConstantInfo | null> = [null]
    for (let i = 1; i < count; i += 1) {
      const constantInfo: ConstantInfo = {
        tag: this.parseTag(),
      }
      switch (constantInfo.tag.value) {
        case CONSTANT_TAG.CONSTANT_Class:
        case CONSTANT_TAG.CONSTANT_Module:
        case CONSTANT_TAG.CONSTANT_Package:
          constantInfo.name_index = this.parseIndex2()
          break
        case CONSTANT_TAG.CONSTANT_Fieldref:
        case CONSTANT_TAG.CONSTANT_Methodref:
        case CONSTANT_TAG.CONSTANT_InterfaceMethodref:
          constantInfo.class_index = this.parseClass()
          constantInfo.name_and_type_index = this.parseIndex2()
          break
        case CONSTANT_TAG.CONSTANT_NameAndType:
          constantInfo.name_index = this.parseIndex2()
          constantInfo.descriptor_index = this.parseIndex2()
          break
        case CONSTANT_TAG.CONSTANT_String:
          constantInfo.string_index = this.parseIndex2()
          break
        case CONSTANT_TAG.CONSTANT_MethodHandle:
          constantInfo.reference_kind = this.parseReferenceKind()
          constantInfo.reference_index = this.parseIndex2()
          break
        case CONSTANT_TAG.CONSTANT_MethodType:
          constantInfo.descriptor_index = this.parseIndex2()
          break
        case CONSTANT_TAG.CONSTANT_Dynamic:
        case CONSTANT_TAG.CONSTANT_InvokeDynamic:
          constantInfo.bootstrap_method_attr_index = this.reader.readU2()
          constantInfo.name_and_type_index = this.parseIndex2()
          break
        case CONSTANT_TAG.CONSTANT_Utf8:
          constantInfo.length = this.parseCount()
          constantInfo.bytes = this.reader.readUtf8(constantInfo.length.value)
          break
        case CONSTANT_TAG.CONSTANT_Integer:
          constantInfo.bytes = this.parseInteger()
          break
        case CONSTANT_TAG.CONSTANT_Long:
          constantInfo.bytes = this.parseLong()
          break
        case CONSTANT_TAG.CONSTANT_Float:
          constantInfo.bytes = this.parseFloat()
          break
        case CONSTANT_TAG.CONSTANT_Double:
          constantInfo.bytes = this.parseDouble()
          break
        default:
          throw new Error('unknown constant tag')
      }
      result.push(constantInfo)
    }
    return result
  }

  resolveConstantIndex () {
    for (let i = 1; i < this.constant_pool.length; i += 1) {
      const item = this.constant_pool[i]
      item.name = this.getName(i)
      let keys = [
        'name_index',
        'class_index',
        'name_and_type_index',
        'descriptor_index',
        'string_index',
        'reference_index',
      ]
      keys.forEach((key) => {
        if (item[key]) {
          item[key].name = this.getName(item[key].value)
        }
      })
    }
  }

  parseFlags (ACCESS_FLAGS: Record<string, FlagItem>) {
    const flags = this.reader.readU2()
    flags.name = this.getAccessFlagsDesc(flags.value, ACCESS_FLAGS)
    return flags
  }

  parseClass () {
    const data = this.reader.readU2()
    if (data.value === 0) {
      data.name = 'java/lang/Object'
    } else {
      data.name = this.getName(data.value)
    }
    return data
  }

  parseIndex2 () {
    const data = this.reader.readU2()
    data.name = this.getName(data.value)
    return data
  }

  parseIndex1 () {
    const data = this.reader.readU1()
    data.name = this.getName(data.value)
    return data
  }

  parseLocal1 () {
    const data = this.reader.readU1()
    data.name = '@' + data.value
    return data
  }

  parseLocal2 () {
    const data = this.reader.readU2()
    data.name = '@' + data.value
    return data
  }

  parseAttribute () {
    let attribute: any = {
      attribute_name_index: this.parseIndex2(),
      attribute_length: this.reader.readU4(),
    }
    if (attribute.attribute_name_index.name === 'Code') {
      attribute = {
        ...attribute,
        ...this.parseCodeAttribute(),
      }
    } else {
      attribute.info = {
        offset: this.reader.getOffset(),
        bytes: null,
      }
      this.reader.eat(attribute.attribute_length.value)
    }
    return attribute
  }

  parseAttributes (count: number) {
    const attributes = []
    for (let i = 0; i < count; i += 1) {
      attributes.push(this.parseAttribute())
    }
    return attributes
  }

  parseFieldOrMethod (ACCESS_FLAGS: AccessFlags) {
    const info: any = {
      access_flags: this.parseFlags(ACCESS_FLAGS),
      name_index: this.parseIndex2(),
      descriptor_index: this.parseIndex2(),
      attributes_count: this.parseCount(),
    }
    info.attributes = this.parseAttributes(info.attributes_count.value)
    return info
  }

  parseFieldsOrMethods (count: number, ACCESS_FLAGS: AccessFlags) {
    const list = []
    for (let i = 0; i < count; i += 1) {
      list.push(this.parseFieldOrMethod(ACCESS_FLAGS))
    }
    return list
  }

  parseOpcode () {
    const opcode = this.reader.readU1()
    // @ts-ignore
    const info = BYTE_CODES[opcode.value]
    if (!info) {
      throw new Error('unknown opcode ' + opcode.value)
    }
    opcode.name = info.name
    return { opcode, operands: info.operands }
  }

  parseInstruction (codeOffset: number) {
    const { opcode: bytecode, operands } = this.parseOpcode()
    const opcodeOffset = bytecode.offset - codeOffset
    const list: Array<UItem | Array<UItem>> = [bytecode]
    if (bytecode.name === 'wide') {
      const { opcode } = this.parseOpcode()
      list.push(opcode)
      list.push(this.reader.readU2())
      if (opcode.name === 'iinc') {
        list.push(this.reader.readU2())
      }
    } else if (bytecode.name === 'tableswitch') {
      this.reader.align(opcodeOffset + 1, 4)
      const defaultAddress = this.reader.readS4()
      defaultAddress.value += opcodeOffset
      list.push(defaultAddress)
      const low = this.reader.readS4()
      const high = this.reader.readS4()
      list.push(low)
      list.push(high)
      for (let i = low.value; i <= high.value; i += 1) {
        const offset = this.reader.readS4()
        offset.value += opcodeOffset
        list.push(offset)
      }
    } else if (bytecode.name === 'lookupswitch') {
      this.reader.align(opcodeOffset + 1, 4)
      const defaultAddress = this.reader.readS4()
      defaultAddress.value += opcodeOffset
      list.push(defaultAddress)
      const npairs = this.reader.readS4()
      list.push(npairs)
      for (let i = 0; i < npairs.value; i += 1) {
        const match = this.reader.readS4()
        const offset = this.reader.readS4()
        offset.value += opcodeOffset
        list.push([match, offset])
      }
    } else if (operands) {
      for (let i = 0; i < operands.length; i += 1) {
        list.push(this.parseOperand(operands[i], opcodeOffset))
      }
    }
    console.log('code', list)
    return list
  }

  parseCode (len: number) {
    const codeOffset = this.reader.getOffset()
    const maxOffset = codeOffset + len
    const list = []
    while (this.reader.getOffset() < maxOffset) {
      list.push(this.parseInstruction(codeOffset))
    }
    return list
  }

  parseExceptionTable () {

  }

  parseCodeAttribute () {
    let info: any = {
      max_stack: this.reader.readU2(),
      max_locals: this.reader.readU2(),
      code_length: this.reader.readU4(),
    }
    info = {
      ...info,
      code: this.parseCode(info.code_length.value),
      exception_table_length: this.reader.readU2(),
      exception_table: this.parseExceptionTable(),
      attributes_count: this.reader.readU2(),
    }
    info.attributes = this.parseAttributes(info.attributes_count.value)
    return info
  }

  parseBootstrapMethodsAttribute () {}

  parseStackMapTableAttribute () {}

  parseSourceFileAttribute () {}

  parseInnerClassesAttribute () {}

  parse () {
    const magic = this.parseMagic()
    const version = this.parseVersion()
    const constant_pool_count = this.parseCount()
    this.constant_pool = this.parseConstantPool(constant_pool_count.value)
    this.resolveConstantIndex()
    const access_flags = this.parseFlags(CLASS_ACCESS_FLAGS)
    const this_class = this.parseClass()
    const super_class = this.parseClass()
    if ((access_flags.value & CLASS_ACCESS_FLAGS.ACC_INTERFACE.value) > 0) {
      super_class.name = ''
    }

    const interfaces_count = this.parseCount()
    const interfaces = []
    for (let i = 0; i < interfaces_count.value; i += 1) {
      interfaces.push(this.parseClass())
    }

    const fields_count = this.parseCount()
    const fields = this.parseFieldsOrMethods(fields_count.value,
      FIELD_ACCESS_FLAGS)

    const methods_count = this.parseCount()
    const methods = this.parseFieldsOrMethods(methods_count.value,
      METHOD_ACCESS_FLAGS)

    const attributes_count = this.parseCount()
    const attributes = this.parseAttributes(attributes_count.value)

    return {
      magic,
      version,
      constant_pool_count,
      constant_pool: this.constant_pool,
      access_flags,
      this_class,
      super_class,
      interfaces_count,
      interfaces,
      fields_count,
      fields,
      methods_count,
      methods,
      attributes_count,
      attributes,
    }
  }
}

export {
  Parser,
  CONSTANT_KIND,
  REFERENCE_KIND,
}

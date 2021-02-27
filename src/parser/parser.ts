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
      .filter((item) => (item.value & flags) > 0 && item.name)
      .map((item) => item.name)
      .join(' ')
  }

  parseFieldType (desc: string, at: number): {nextAt: number, type: string} {
    const BaseType: Record<string, string> = {
      B: 'byte',
      C: 'char',
      D: 'double',
      F: 'float',
      I: 'int',
      J: 'long',
      Z: 'boolean',
      V: 'void'
    }
    let baseType = BaseType[desc[at]]
    if (baseType) {
      return {
        nextAt: at + 1,
        type: baseType,
      }
    } else if (desc[at] === 'L') {
      at += 1
      let res = ''
      while (desc[at] !== ';') {
        res += desc[at]
        at += 1;
      }
      return {
        nextAt: at + 1,
        type: res,
      }
    } else if (desc[at] === '[') {
      const typeData = this.parseFieldType(desc, at + 1)
      return {
        nextAt: typeData.nextAt,
        type: typeData.type + '[]'
      }
    } else {
      throw new Error('unknown field type: ' + desc)
    }
  }
  parseDescriptor (desc: string, name: string) {
    let at = 0
    if (desc[at] === '(') {
      at += 1
      let paramsRes = ''
      while (desc[at] !== ')') {
        const {
          nextAt,
          type,
        } = this.parseFieldType(desc, at);
        if (paramsRes) {
          paramsRes += ', '
        }
        paramsRes += type
        at = nextAt
      }
      at += 1;
      const {
        type: returnType
      } = this.parseFieldType(desc, at)
      return `${returnType} ${name}(${paramsRes});`
    } else {
      const {
        type: fieldType
      } = this.parseFieldType(desc, at)
      return `${fieldType} ${name};`
    }
  }
  getName (index: number, className: string = '') : string {
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
        return this.getName(item.name_and_type_index.value, this.getName(item.class_index.value))
      case CONSTANT_TAG.CONSTANT_Methodref:
      case CONSTANT_TAG.CONSTANT_InterfaceMethodref:
        return this.getName(item.name_and_type_index.value, this.getName(item.class_index.value))
      case CONSTANT_TAG.CONSTANT_NameAndType:
        if (className) {
          className += '.'
        }
        const name = `${className}${this.getName(item.name_index.value)}`
        const desc =  this.getName(item.descriptor_index.value)
        return this.parseDescriptor(desc, name)
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
        return item.reference_kind.name + ' ' +
          this.getName(item.reference_index.value)
      case CONSTANT_TAG.CONSTANT_MethodType:
        return this.parseDescriptor(this.getName(item.descriptor_index.value), '')
      case CONSTANT_TAG.CONSTANT_Dynamic:
      case CONSTANT_TAG.CONSTANT_InvokeDynamic:
        return `bootstrap_${item.bootstrap_method_attr_index.value}: ${this.getName(item.name_and_type_index.value)}`
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

  parseConstantPool () {
    const constant_pool_count = this.reader.readU2()
    let result: Array<ConstantInfo | null> = [null]
    for (let i = 1; i < constant_pool_count.value; i += 1) {
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
    return {
      constant_pool_count,
      constant_pool: result,
    }
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
    flags.name = this.getAccessFlagsDesc(flags.value, ACCESS_FLAGS).replace(/ACC_/g, '').toLowerCase()
    return flags
  }

  parseClass () {
    const data = this.reader.readU2()
    if (data.value === 0) {
      data.name = ''
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
    switch (attribute.attribute_name_index.name) {
      case 'Code':
        attribute = {
          ...attribute,
          ...this.parseCodeAttribute(),
        }
        break
      case 'BootstrapMethods':
        attribute = {
          ...attribute,
          ...this.parseBootstrapMethodsAttribute(),
        }
        break
      case 'ConstantValue':
        attribute = {
          ...attribute,
          constantvalue_index: this.parseIndex2(),
        }
        break
      case 'SourceFile':
        attribute = {
          ...attribute,
          sourcefile_index: this.parseIndex2(),
        }
        break
      case 'InnerClasses':
        attribute = {
          ...attribute,
          ...this.parseInnerClasses(),
        }
        break
      default:
        attribute.info = {
          offset: this.reader.getOffset(),
          bytes: null,
        }
        this.reader.eat(attribute.attribute_length.value)
        break;
    }
    return attribute
  }

  parseAttributes () {
    const attributes_count = this.reader.readU2()
    const attributes = []
    for (let i = 0; i < attributes_count.value; i += 1) {
      attributes.push(this.parseAttribute())
    }
    return {
      attributes_count,
      attributes,
    }
  }

  parseFieldOrMethod (ACCESS_FLAGS: AccessFlags) {
    const data = {
      access_flags: this.parseFlags(ACCESS_FLAGS),
      name_index: this.parseIndex2(),
      descriptor_index: this.parseIndex2(),
    }
    const desc =  this.getName(data.descriptor_index.value)
    return {
      name: this.parseDescriptor(desc, this.getName(data.name_index.value)),
      ...data,
      ...this.parseAttributes(),
    }
  }

  parseFields () {
    const fields_count = this.reader.readU2()
    const list = []
    for (let i = 0; i < fields_count.value; i += 1) {
      list.push(this.parseFieldOrMethod(FIELD_ACCESS_FLAGS))
    }
    return {
      fields_count,
      fields: list,
    }
  }
  parseMethods () {
    const methods_count = this.reader.readU2()
    const list = []
    for (let i = 0; i < methods_count.value; i += 1) {
      list.push(this.parseFieldOrMethod(METHOD_ACCESS_FLAGS))
    }
    return {
      methods_count,
      methods: list,
    }
  }

  parseInterfaces () {
    const interfaces_count = this.reader.readU2()
    const interfaces = []
    for (let i = 0; i < interfaces_count.value; i += 1) {
      interfaces.push(this.parseClass())
    }
    return {
      interfaces_count,
      interfaces,
    }
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
    } else if (bytecode.name === 'invokedynamic' || bytecode.name === 'invokeinterface') {
      list.push(this.parseOperand(operands[0], opcodeOffset))
      this.parseOperand(operands[1], opcodeOffset)
    } else if (operands) {
      for (let i = 0; i < operands.length; i += 1) {
        list.push(this.parseOperand(operands[i], opcodeOffset))
      }
    }
    return list
  }

  parseCode () {
    const code_length = this.reader.readU4()
    const codeOffset = this.reader.getOffset()
    const maxOffset = codeOffset + code_length.value
    const list = []
    while (this.reader.getOffset() < maxOffset) {
      list.push(this.parseInstruction(codeOffset))
    }
    return {
      code_length,
      code: list,
    }
  }

  parseExceptionTable () {
    const exception_table_length = this.reader.readU2()
    const exception_table = []
    for (let i = 0; i < exception_table_length.value; i += 1) {
      exception_table.push({
        start_pc: this.reader.readU2(),
        end_pc: this.reader.readU2(),
        handler_pc: this.reader.readU2(),
        catch_type: this.parseClass()
      })
    }
    return {
      exception_table_length,
      exception_table: exception_table,
    }
  }

  parseCodeAttribute () {
    return {
      max_stack: this.reader.readU2(),
      max_locals: this.reader.readU2(),
      ...this.parseCode(),
      ...this.parseExceptionTable(),
      ...this.parseAttributes(),
    }
  }

  parseBootstrapMethodsAttribute () {
    const num_bootstrap_methods = this.reader.readU2()
    const bootstrap_methods = []
    for (let i = 0; i < num_bootstrap_methods.value; i += 1) {
      const bootstrap_method_ref = this.parseIndex2()
      const num_bootstrap_arguments = this.reader.readU2()
      const bootstrap_arguments = []
      for (let j = 0; j < num_bootstrap_arguments.value; j += 1) {
        bootstrap_arguments.push(this.parseIndex2())
      }
      bootstrap_methods.push({
        bootstrap_method_ref,
        num_bootstrap_arguments,
        bootstrap_arguments,
      })
    }
    return {
      num_bootstrap_methods,
      bootstrap_methods,
    }
  }

  parseInnerClasses () {
    const number_of_classes = this.reader.readU2()
    const classes = []
    for (let i = 0; i < number_of_classes.value; i += 1) {
      classes.push({
        inner_class_info_index: this.parseClass(),
        outer_class_info_index: this.parseClass(),
        inner_name_index: this.parseIndex2(),
        inner_class_access_flags: this.parseFlags(CLASS_ACCESS_FLAGS),
      })
    }
    return {
      number_of_classes,
      classes
    }
  }

  parse () {
    const magic = this.parseMagic()
    const version = this.parseVersion()
    const constantPool = this.parseConstantPool()
    this.constant_pool = constantPool.constant_pool
    this.resolveConstantIndex()

    const data = {
      magic: magic,
      version: version,
      ...constantPool,
      access_flags: this.parseFlags(CLASS_ACCESS_FLAGS),
      this_class: this.parseClass(),
      super_class: this.parseClass(),
      ...this.parseInterfaces(),
      ...this.parseFields(),
      ...this.parseMethods(),
      ...this.parseAttributes(),
    }
    console.log('parse data', data)
    return data
  }
}

export {
  Parser,
  CONSTANT_KIND,
  REFERENCE_KIND,
}

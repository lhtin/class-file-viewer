import { BYTE_CODES, OPERAND_TYPES } from './bytecodes'
import {
  CLASS_ACCESS_FLAGS,
  CONSTANT_KIND,
  FIELD_ACCESS_FLAGS,
  METHOD_ACCESS_FLAGS,
  REFERENCE_KIND
} from './constants'
import { Uint8Reader } from './Uint8Reader'
import {AccessFlags, ConstantInfo, FlagItem, UItem} from "./typing";
import {Utils} from "./Utils";
import { ConstantPoolParser } from "./ConstantPoolParser";

class ClassParser {
  private reader: Uint8Reader
  private constant_pool: any
  constructor (reader: Uint8Reader) {
    this.reader = reader
  }

  getData () {
    return this.parse()
  }

  getConstant (index: number): ConstantInfo {
    const result = this.constant_pool.find((item: any) => item.index === index)
    if (!result) {
      throw new Error('没有在constant_pool中找到')
    }
    return result
  }

  getName(index: number)  {
    const name = this.getConstant(index).name
    if (!name) {
      throw new Error('constant 没有设置name属性')
    }
    return name
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
    let operand: UItem
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
        operand = this.parseIndex1(true)
        break
      case OPERAND_TYPES.constant_index2:
        operand = this.parseIndex2(true)
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

  parseFlags (ACCESS_FLAGS: Record<string, FlagItem>) {
    const flags = this.reader.readU2()
    flags.name = Utils.getAccessFlagsDesc(flags.value, ACCESS_FLAGS).replace(/ACC_/g, '').toLowerCase()
    // console.log(flags)
    return flags
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
    // console.log(data)
    const desc =  this.getName(data.descriptor_index.value)
    return {
      name: `${data.access_flags.name} ${Utils.parseDescriptor(desc, this.getName(data.name_index.value))}`,
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
    const data = {
      fields_count,
      fields: list,
    }
    // console.log('fields', data);
    return data
  }
  parseMethods () {
    const methods_count = this.reader.readU2()
    const list = []
    for (let i = 0; i < methods_count.value; i += 1) {
      list.push(this.parseFieldOrMethod(METHOD_ACCESS_FLAGS))
    }
    const data = {
      methods_count,
      methods: list,
    }
    // console.log('methods', data)
    return data
  }

  parseInterfaces () {
    const interfaces_count = this.reader.readU2()
    const interfaces = []
    for (let i = 0; i < interfaces_count.value; i += 1) {
      interfaces.push(this.parseIndex2())
    }
    const data = {
      interfaces_count,
      interfaces,
    }
    // console.log('interfaces', data)
    return data
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
        catch_type: this.parseIndex2()
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
        inner_class_info_index: this.parseIndex2(),
        outer_class_info_index: this.parseIndex2(),
        inner_name_index: this.parseIndex2(),
        inner_class_access_flags: this.parseFlags(CLASS_ACCESS_FLAGS),
      })
    }
    return {
      number_of_classes,
      classes
    }
  }

  parseIndex1 (withTag: boolean = false) {
    const data = this.reader.readU1()
    const constant = this.getConstant(data.value)
    if (withTag) {
      data.name = `${constant.tag.name}: ${constant.name}`
    } else {
      data.name = constant.name
    }
    return data
  }
  parseIndex2 (withTag: boolean = false) {
    const data = this.reader.readU2()
    const constant = this.getConstant(data.value)
    if (withTag) {
      data.name = `${constant.tag.name}: ${constant.name}`
    } else {
      data.name = constant.name
    }
    // console.log('index2', data)
    return data
  }

  parse () {
    const magic = this.parseMagic()
    const version = this.parseVersion()
    const constantPoolParser = new ConstantPoolParser(this.reader)
    const constantPool = constantPoolParser.parseConstantPool()
    this.constant_pool = constantPool.constant_pool

    const data = {
      u: this.reader.getU(),
      magic: magic,
      version: version,
      ...constantPool,
      access_flags: this.parseFlags(CLASS_ACCESS_FLAGS),
      this_class: this.parseIndex2(),
      super_class: this.parseIndex2(),
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
  ClassParser,
  CONSTANT_KIND,
  REFERENCE_KIND,
}

import {ConstantInfo, UItem} from "./typing";
import {CONSTANT_KIND, CONSTANT_TAG, REFERENCE_KIND} from "./constants";
import {Uint8Reader} from "./Uint8Reader";
import {Utils} from "./Utils";

export class ConstantPoolParser {
  reader: Uint8Reader
  private constantPool: any
  constructor(reader: Uint8Reader) {
    this.reader = reader
  }
  getName(index: number, className: string = '') : string {
    // console.log('index', index);
    const item = this.constantPool.find((item: any) => item.index === index)
    if (!item) {
      throw new Error('constant item undefined')
    }
    switch (item.tag.value) {
      case CONSTANT_TAG.CONSTANT_Class:
        return Utils.parseClassType(this.getName(item.name_index.value))
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
        return Utils.parseDescriptor(desc, name)
      case CONSTANT_TAG.CONSTANT_String:
        return this.getName(item.string_index.value)
      case CONSTANT_TAG.CONSTANT_Integer:
      case CONSTANT_TAG.CONSTANT_Float:
      case CONSTANT_TAG.CONSTANT_Long:
      case CONSTANT_TAG.CONSTANT_Double:
        return String(item.bytes.value)
      case CONSTANT_TAG.CONSTANT_Utf8:
        return item.bytes.name
      case CONSTANT_TAG.CONSTANT_MethodHandle:
        return item.reference_kind.name + ' ' +
          this.getName(item.reference_index.value)
      case CONSTANT_TAG.CONSTANT_MethodType:
        return Utils.parseDescriptor(this.getName(item.descriptor_index.value), '')
      case CONSTANT_TAG.CONSTANT_Dynamic:
      case CONSTANT_TAG.CONSTANT_InvokeDynamic:
        return `bootstrap_${item.bootstrap_method_attr_index.value}: ${this.getName(item.name_and_type_index.value)}`
      default:
        return 'unknown tag'
    }
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
  resolveConstantPool (constantPool: any) {
    this.constantPool = constantPool
    for (let i = 0; i < constantPool.length; i += 1) {
      const item = constantPool[i]
      item.name = this.getName(item.index)
    }
  }
  parseConstant (index: number) {
    const constantInfo: ConstantInfo = {
      index,
      tag: this.parseTag(),
    }
    switch (Number(constantInfo.tag.value)) {
      case CONSTANT_TAG.CONSTANT_Class:
      case CONSTANT_TAG.CONSTANT_Module:
      case CONSTANT_TAG.CONSTANT_Package:
        constantInfo.name_index = this.reader.readU2()
        break
      case CONSTANT_TAG.CONSTANT_Fieldref:
      case CONSTANT_TAG.CONSTANT_Methodref:
      case CONSTANT_TAG.CONSTANT_InterfaceMethodref:
        constantInfo.class_index = this.reader.readU2()
        constantInfo.name_and_type_index = this.reader.readU2()
        break
      case CONSTANT_TAG.CONSTANT_NameAndType:
        constantInfo.name_index = this.reader.readU2()
        constantInfo.descriptor_index = this.reader.readU2()
        break
      case CONSTANT_TAG.CONSTANT_String:
        constantInfo.string_index = this.reader.readU2()
        break
      case CONSTANT_TAG.CONSTANT_MethodHandle:
        constantInfo.reference_kind = this.reader.readU1()
        // @ts-ignore
        constantInfo.reference_kind.name = REFERENCE_KIND[constantInfo.reference_kind.value].name
        constantInfo.reference_index = this.reader.readU2()
        break
      case CONSTANT_TAG.CONSTANT_MethodType:
        constantInfo.descriptor_index = this.reader.readU2()
        break
      case CONSTANT_TAG.CONSTANT_Dynamic:
      case CONSTANT_TAG.CONSTANT_InvokeDynamic:
        constantInfo.bootstrap_method_attr_index = this.reader.readU2()
        constantInfo.name_and_type_index = this.reader.readU2()
        break
      case CONSTANT_TAG.CONSTANT_Utf8:
        constantInfo.length = this.reader.readU2()
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
    return constantInfo
  }
  parseConstantPool () {
    const constant_pool_count = this.reader.readU2()
    let result: Array<ConstantInfo> = []
    for (let i = 1; i < constant_pool_count.value; i += 1) {
      const constant = this.parseConstant(i)
      result.push(constant)
      const tag = constant.tag.value
      if (tag === CONSTANT_TAG.CONSTANT_Long || tag === CONSTANT_TAG.CONSTANT_Double) {
        i += 1
      }
    }
    this.resolveConstantPool(result)
    // console.log(result)
    return {
      constant_pool_count,
      constant_pool: result,
    }
  }
  getConstantPool() {
    return this.constantPool
  }
}

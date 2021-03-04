import {FlagItem} from "./typing";

export class Utils {
  static getAccessFlagsDesc (flags: number, flagMap: Record<number, FlagItem>) {
    return Object.values(flagMap)
      .filter((item) => (item.value & flags) > 0 && item.name)
      .map((item) => item.name)
      .join(' ')
  }
  static parseClassType (className: string) {
    return className.replace(/\//g, '.');
  }
  private static parseFieldType (desc: string, at: number): {nextAt: number, type: string} {
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
        type: Utils.parseClassType(res),
      }
    } else if (desc[at] === '[') {
      const typeData = Utils.parseFieldType(desc, at + 1)
      return {
        nextAt: typeData.nextAt,
        type: typeData.type + '[]'
      }
    } else {
      throw new Error('unknown field type: ' + desc)
    }
  }
  static parseDescriptor (desc: string, name: string) {
    let at = 0
    if (desc[at] === '(') {
      at += 1
      let paramsRes = ''
      while (desc[at] !== ')') {
        const {
          nextAt,
          type,
        } = Utils.parseFieldType(desc, at);
        if (paramsRes) {
          paramsRes += ', '
        }
        paramsRes += type
        at = nextAt
      }
      at += 1;
      const {
        type: returnType
      } = Utils.parseFieldType(desc, at)
      return `${returnType} ${name}(${paramsRes})`
    } else {
      const {
        type: fieldType
      } = Utils.parseFieldType(desc, at)
      return `${fieldType} ${name}`
    }
  }
}

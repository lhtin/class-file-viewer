const CLASS_ACCESS_FLAGS = {
  ACC_PUBLIC: {
    value: 0x0001,
    name: 'ACC_PUBLIC',
    desc: 'Declared public; may be accessed from outside its package.',
  },
  ACC_FINAL: {
    value: 0x0010,
    name: 'ACC_FINAL',
  },
  ACC_SUPER: {
    value: 0x0020,
    name: 'ACC_SUPER',
  },
  ACC_INTERFACE: {
    name: 'ACC_INTERFACE',
    value: 0x0200,
  },
  ACC_ABSTRACT: {
    name: 'ACC_ABSTRACT',
    value: 0x0400,
  },
  ACC_SYNTHETIC: {
    name: 'ACC_SYNTHETIC',
    value: 0x1000,
  },
  ACC_ANNOTATION: {
    name: 'ACC_ANNOTATION',
    value: 0x2000,
  },
  ACC_ENUM: {
    name: 'ACC_ENUM',
    value: 0x4000,
  },
  ACC_MODULE: {
    name: 'ACC_MODULE',
    value: 0x8000,
  },
}
const FIELD_ACCESS_FLAGS = {
  ACC_PUBLIC: {
    value: 0x0001,
    name: 'ACC_PUBLIC',
  },
  ACC_PROTECTED: {
    value: 0x0004,
    name: 'ACC_PROTECTED',
  },
  ACC_STATIC: {
    value: 0x0008,
    name: 'ACC_STATIC',
  },
  ACC_FINAL: {
    value: 0x0010,
    name: 'ACC_FINAL',
  },
  ACC_VOLATILE: {
    value: 0x0040,
    name: 'ACC_VOLATILE',
  },
  ACC_TRANSIENT: {
    value: 0x0080,
    name: 'ACC_TRANSIENT',
  },
  ACC_SYNTHETIC: {
    value: 0x1000,
    name: 'ACC_SYNTHETIC',
  },
  ACC_ENUM: {
    value: 0x4000,
    name: 'ACC_ENUM',
  },
}
const METHOD_ACCESS_FLAGS = {
  ACC_PUBLIC: {
    value: 0x0001,
    name: 'ACC_PUBLIC',
  },
  ACC_PROTECTED: {
    value: 0x0004,
    name: 'ACC_PROTECTED',
  },
  ACC_STATIC: {
    value: 0x0008,
    name: 'ACC_STATIC',
  },
  ACC_FINAL: {
    value: 0x0010,
    name: 'ACC_FINAL',
  },
  ACC_SYNCHRONIZED: {
    value: 0x0020,
    name: 'ACC_SYNCHRONIZED',
  },
  ACC_BRIDGE: {
    value: 0x0040,
    name: 'ACC_BRIDGE',
  },
  ACC_VARARGS: {
    value: 0x0080,
    name: 'ACC_VARARGS',
  },
  ACC_NATIVE: {
    value: 0x0100,
    name: 'ACC_NATIVE',
  },
  ACC_ABSTRACT: {
    value: 0x0400,
    name: 'ACC_ABSTRACT',
  },
  ACC_STRICT: {
    value: 0x0800,
    name: 'ACC_STRICT',
  },
  ACC_SYNTHETIC: {
    value: 0x1000,
    name: 'ACC_SYNTHETIC',
  },
}

const CONSTANT_TAG = {
  CONSTANT_Utf8: 1,
  CONSTANT_Integer: 3,
  CONSTANT_Float: 4,
  CONSTANT_Long: 5,
  CONSTANT_Double: 6,
  CONSTANT_Class: 7,
  CONSTANT_String: 8,
  CONSTANT_Fieldref: 9,
  CONSTANT_Methodref: 10,
  CONSTANT_InterfaceMethodref: 11,
  CONSTANT_NameAndType: 12,
  CONSTANT_MethodHandle: 15,
  CONSTANT_MethodType: 16,
  CONSTANT_Dynamic: 17,
  CONSTANT_InvokeDynamic: 18,
  CONSTANT_Module: 19,
  CONSTANT_Package: 20,
}

const CONSTANT_KIND = {
  [CONSTANT_TAG.CONSTANT_Utf8]: { name: 'CONSTANT_Utf8' },
  [CONSTANT_TAG.CONSTANT_Integer]: { name: 'CONSTANT_Integer' },
  [CONSTANT_TAG.CONSTANT_Float]: { name: 'CONSTANT_Float' },
  [CONSTANT_TAG.CONSTANT_Long]: { name: 'CONSTANT_Long' },
  [CONSTANT_TAG.CONSTANT_Double]: { name: 'CONSTANT_Double' },
  [CONSTANT_TAG.CONSTANT_Class]: { name: 'CONSTANT_Class' },
  [CONSTANT_TAG.CONSTANT_String]: { name: 'CONSTANT_String' },
  [CONSTANT_TAG.CONSTANT_Fieldref]: { name: 'CONSTANT_Fieldref' },
  [CONSTANT_TAG.CONSTANT_Methodref]: { name: 'CONSTANT_Methodref' },
  [CONSTANT_TAG.CONSTANT_InterfaceMethodref]: { name: 'CONSTANT_InterfaceMethodref' },
  [CONSTANT_TAG.CONSTANT_NameAndType]: { name: 'CONSTANT_NameAndType' },
  [CONSTANT_TAG.CONSTANT_MethodHandle]: { name: 'CONSTANT_MethodHandle' },
  [CONSTANT_TAG.CONSTANT_MethodType]: { name: 'CONSTANT_MethodType' },
  [CONSTANT_TAG.CONSTANT_Dynamic]: { name: 'CONSTANT_Dynamic' },
  [CONSTANT_TAG.CONSTANT_InvokeDynamic]: { name: 'CONSTANT_InvokeDynamic' },
  [CONSTANT_TAG.CONSTANT_Module]: { name: 'CONSTANT_Module' },
  [CONSTANT_TAG.CONSTANT_Package]: { name: 'CONSTANT_Package' },
}

const REFERENCE_KIND = {
  1: { name: 'REF_getField', desc: 'getfield C.f:T' },
  2: { name: 'REF_getStatic', desc: 'getstatic C.f:T' },
  3: { name: 'REF_putField', desc: 'putfield C.f:T' },
  4: { name: 'REF_putStatic', desc: 'putstatic C.f:T' },
  5: { name: 'REF_invokeVirtual', desc: 'invokevirtual C.m:(A*)T' },
  6: { name: 'REF_invokeStatic', desc: 'invokestatic C.m:(A*)T' },
  7: { name: 'REF_invokeSpecial', desc: 'invokespecial C.m:(A*)T' },
  8: {
    name: 'REF_newInvokeSpecial',
    desc: 'new C; dup; invokespecial C.<init>:(A*)V',
  },
  9: { name: 'REF_invokeInterface', desc: 'invokeinterface C.m:(A*)T' },
}

export {
  CLASS_ACCESS_FLAGS,
  CONSTANT_KIND,
  FIELD_ACCESS_FLAGS,
  METHOD_ACCESS_FLAGS,
  REFERENCE_KIND,
  CONSTANT_TAG
}

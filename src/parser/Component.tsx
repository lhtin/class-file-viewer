import {CONSTANT_TAG} from './constants'
import {OPERAND_TYPES} from './bytecodes'
import {UItem} from "./typing";
import {useState} from "react";

const ConstantAnchor = ({info, showDesc}: { info: UItem, showDesc?: boolean }) => {
  const anchor = '#constant_pool_index_' + info.value
  return <>
    <a
      className={'constant-anchor'}
      href={anchor}
      title={info.name}
    >#{info.value}</a>
    {showDesc ? <ConstantDesc desc={info.name || ''}/> : null}
  </>
}
const OffsetAnchor = ({offset}: {offset: number}) => {
  const anchor = '#offset-' + offset
  return <>
    <a
      className={'constant-anchor'}
      href={anchor}
    >@{offset}</a>
  </>
}

const ConstantIndex = ({index}: { index: number }) => {
  return <span className={'constant-index'} id={'constant_pool_index_' + index}>#{index}</span>
}

const ConstantAnchorList = ({infoList}: { infoList: Array<UItem> }) => {
  return <span className={'constant-anchor-list'}>
      {infoList.map((info, index) => <ConstantAnchor key={index} info={info}/>)}
    </span>
}

const ConstantName = ({tag}: { tag: UItem }) => {
  return <span className={'constant-tag'}>{tag.name}</span>
}

const ConstantDesc = ({desc}: { desc: string }) => {
  return <span className={'constant-desc'}>// {desc}</span>
}

const Constant = ({children}: {children: any}) => {
  return <div className={'constant-item'}>{children}</div>
}

const ConstantView = ({item, index}: {item: any, index: number}) => {
  index += 1;
  switch (item.tag.value) {
    case CONSTANT_TAG.CONSTANT_Class:
    case CONSTANT_TAG.CONSTANT_Module:
    case CONSTANT_TAG.CONSTANT_Package:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.name_index]}/>
        <ConstantDesc desc={item.name_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_Fieldref:
    case CONSTANT_TAG.CONSTANT_Methodref:
    case CONSTANT_TAG.CONSTANT_InterfaceMethodref:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.class_index, item.name_and_type_index]} />
        <ConstantDesc desc={item.class_index.name + '.' + item.name_and_type_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_NameAndType:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.name_index, item.descriptor_index]}/>
        <ConstantDesc desc={item.name_index.name + ': ' + item.descriptor_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_String:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.string_index]}/>
        <ConstantDesc desc={item.string_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_MethodHandle:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        {item.reference_kind.value}:
        <ConstantAnchorList infoList={[item.reference_index]}/>
        <ConstantDesc desc={item.reference_kind.name + ' ' + item.reference_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_MethodType:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.descriptor_index]}/>
        <ConstantDesc desc={item.descriptor_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_Dynamic:
    case CONSTANT_TAG.CONSTANT_InvokeDynamic:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        {item.bootstrap_method_attr_index.value}:
        <ConstantAnchorList infoList={[item.name_and_type_index]}/>
        <ConstantDesc desc={item.name_and_type_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_Utf8:
    case CONSTANT_TAG.CONSTANT_Integer:
    case CONSTANT_TAG.CONSTANT_Long:
    case CONSTANT_TAG.CONSTANT_Float:
    case CONSTANT_TAG.CONSTANT_Double:
      return <Constant>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        {item.bytes.name || item.bytes.value}
      </Constant>
    default:
      throw new Error('unknown constant tag')
  }
}

const FieldAndMethod = ({item}: {item: any}) => {
  return <>
    <div>{item.access_flags.name} {item.name_index.name}: {item.descriptor_index.name}</div>
    {item.attributes_count.value > 0
      ? <AttributesView attributes={item.attributes}/>
      : null}
  </>
}

const FieldsAndMethods = ({list}: {list: any}) => {
  return <ul className={'fields-and-methods'}>
    {list.map((item: any, index: number) => (
      <li className={'field-and-method'} key={index}><FieldAndMethod item={item}/></li>
    ))}
  </ul>
}

const Switch = ({tag, value} : {tag: string | number, value: number}) => {
  return <div className={'switch'}>
    <div className={'switch-tag'}>{tag}:</div>
    <div><OffsetAnchor offset={value} /></div>
  </div>
}
const Tableswitch = ({inst}: {inst: any}) => {
  const opcode = inst[0]
  const defaultOffset = inst[1]
  const low = inst[2]
  const high = inst[3]
  return <div className={'bytecode-tableswitch'}>
    <div className={'opcode-name'}>{`${opcode.name} { `} <span className={'gray'}>// {low.value} - {high.value}</span></div>
    <ul>
      {inst.slice(4).map((item: any, index: number) => (
        <li key={index}><Switch tag={low.value + index} value={item.value} /></li>
      ))}
      <li><Switch tag={'default'} value={defaultOffset.value} /></li>
    </ul>
    <div>{'}'}</div>
  </div>
}

const Lookupswitch = ({inst}: {inst: any}) => {
  const opcode = inst[0]
  const defaultOffset = inst[1]
  const npars = inst[2]
  const list = []
  for (let i = 1; i <= npars.value; i += 1) {
    const item = inst[i + 2]
    list.push(<li key={i}><Switch tag={item[0].value} value={item[1].value} /></li>)
  }
  return <div className={'bytecode-lockupswitch'}>
    <div className={'opcode-name'}>{`${opcode.name} { `} <span className={'gray'}>// {npars.value}</span></div>
    <ul>
      {list}
      <li><Switch tag={'default'} value={defaultOffset.value} /></li>
    </ul>
    <div>{'}'}</div>
  </div>
}

const Bytecode = ({inst, baseOffset}: {inst: any, baseOffset: number}) => {
  const opcode = inst[0]
  const at = opcode.offset - baseOffset
  return <>
    <span id={'offset-' + at} className={'bytecode-offset'}>@{at}</span>
    <span className={'bytecode-content'}>
      {opcode.name === 'tableswitch' ?
        <Tableswitch inst={inst}/> :
        opcode.name === 'lookupswitch' ?
          <Lookupswitch inst={inst}/> :
          <>
            <span className={'opcode-name'}>{opcode.name}</span>
            {inst.slice(1).map((operand: any, index: number) => {
              switch (operand.type) {
                case OPERAND_TYPES.constant_index1:
                case OPERAND_TYPES.constant_index2:
                  return <ConstantAnchor key={index} info={operand} showDesc/>
                case OPERAND_TYPES.local_index1:
                case OPERAND_TYPES.local_index2:
                  return <span key={index} className={'local-index'}>${operand.value}</span>
                case OPERAND_TYPES.branch_offset2:
                case OPERAND_TYPES.branch_offset4:
                  return <OffsetAnchor key={index} offset={operand.value} />
                default:
                  return <span key={index} className={'operand-value'}>{operand.value}</span>
              }
            })}
          </>}
    </span>
  </>
}

const Attribute = ({item}: {item: any}) => {
  if (item.attribute_name_index.name === 'Code') {
    const baseOffset = item.code_length.offset + item.code_length.bytes
    return <>
      <div>{item.attribute_name_index.name}:</div>
      <ul className={'attribute-code'}>
        <li>max_stack={item.max_stack.value}, locals={item.max_locals.value}</li>
        {item.code.map((item: any, index: number) => (
          <li className={'bytecode'} key={index}>
            <Bytecode inst={item} baseOffset={baseOffset}/>
          </li>
        ))}
      </ul>
    </>
  } else {
    return <p>'unknown'</p>
  }
}

const AttributesView = ({attributes}: {attributes: any}) => {
  return <ul className={'attributes'}>
    {attributes.map((item: any, index: number) => (
      <li key={index}>
        <Attribute item={item}/>
      </li>
    ))}
  </ul>
}

const Toggle = ({children}: {children: any}) => {
  const [show, setShow] = useState<boolean>(true)
  return <>
    {/*<button onClick={() => setShow(!show)}>{show ? '-' : '+'}</button>*/}
    {show ? children : null}
  </>
}

export const ClassFileView = ({data}: {data: any}) => {
  return (
    <ul>
      <li>version: {data.version.major.value}.{data.version.minor.value}</li>
      <li>access_flags: (0x{data.access_flags.value.toString(16)}) {data.access_flags.name}</li>
      <li>this_class: <ConstantAnchor info={data.this_class} showDesc /></li>
      {data.super_class.value > 0 ? <li>super_class: <ConstantAnchor info={data.super_class} showDesc /></li> : null}
      <li>
        interfaces({data.interfaces_count.value}):
        <ul>
          {data.interfaces.map((item: any, index: number) => (
            <li><ConstantAnchor key={index} info={item} showDesc /></li>
          ))}
        </ul>
      </li>


      <li>
        constant_pool({data.constant_pool_count.value - 1}):
        <Toggle>
          <ul className={'constant-pool'}>
            {data.constant_pool.filter((item: any) => item).map((item: any, index: number) => (
              <li key={index}><ConstantView item={item} index={index}/></li>
            ))}
          </ul>
        </Toggle>
      </li>

      <li>
        fields({data.fields_count.value}):
        <Toggle><FieldsAndMethods list={data.fields}/></Toggle>
      </li>


      <li>
        methods({data.methods_count.value}):
        <Toggle><FieldsAndMethods list={data.methods}/></Toggle>
      </li>


      <li>
        attributes({data.attributes_count.value}):
        <Toggle><AttributesView attributes={data.attributes}/></Toggle>
      </li>
    </ul>
  )
}


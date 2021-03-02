import {CONSTANT_TAG} from './constants'
import {OPERAND_TYPES} from './bytecodes'
import {UItem} from "./typing";
import {useState, MouseEvent, ReactElement, Fragment} from "react";

let ele: Element | null = null
const scrollIntoView = (event: MouseEvent<HTMLElement>) => {
  // @ts-ignore
  const id = event.target.dataset.id
  if (ele) {
    // @ts-ignore
    ele.style.backgroundColor = 'transparent'
  }
  ele = document.getElementById(id)
  // @ts-ignore
  ele.style.backgroundColor = 'yellow'
  ele?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest'
  })
}

const ConstantAnchor = ({info, showDesc, desc}: { info: UItem, showDesc?: boolean, desc?: string }) => {
  return <div className={'constant-anchor'}>
    <div
      onClick={scrollIntoView}
      className={'anchor'}
      title={info.name}
      data-id={`constant_pool_index_${info.value}`}
    >#{info.value}</div>
    {showDesc
      ? <>
        &nbsp;
        <ConstantDesc desc={desc || info.name || ''}/>
      </>
      : null}
  </div>
}
const OffsetAnchor = ({offset}: { offset: number }) => {
  return <div>
    <div
      className={'constant-anchor anchor'}
      onClick={scrollIntoView}
      data-id={`offset-${offset}`}
    >@{offset}</div>
  </div>
}

const BootstrapMethodAnchor = ({index}: { index: number }) => {
  return <div>
    <div
      className={'constant-anchor anchor'}
      onClick={scrollIntoView}
      data-id={`bootstrap-method-${index}`}
    >&{index}</div>
  </div>
}

const ConstantIndex = ({index}: { index: number }) => {
  return <div className={'constant-index'}>#{index}</div>
}

const ConstantAnchorList = ({infoList, children}: { infoList: Array<UItem>, children?: ReactElement }) => {
  return <div className={'constant-value-list'}>
    {children}
    <div className={'constant-anchor-list'}>
      {infoList.map((info, index) => <ConstantAnchor key={index} info={info}/>)}
    </div>
  </div>
}

const ConstantName = ({tag}: { tag: UItem }) => {
  return <div className={'constant-tag'}>{tag.name}</div>
}

const ConstantDesc = ({desc}: { desc: string }) => {
  return <div className={'constant-desc'}>// {desc}</div>
}

const ConstantValue = ({value}: { value: number | string }) => {
  return <div className={'constant-value'}>{value}</div>
}

const Constant = ({index, children}: { index: number, children: any }) => {
  return <div className={'constant-item flex-row'} id={'constant_pool_index_' + index}>{children}</div>
}

const ConstantView = ({item, index}: { item: any, index: number }) => {
  index += 1;
  switch (item.tag.value) {
    case CONSTANT_TAG.CONSTANT_Class:
    case CONSTANT_TAG.CONSTANT_Module:
    case CONSTANT_TAG.CONSTANT_Package:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.name_index]}/>
        <ConstantDesc desc={item.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_Fieldref:
    case CONSTANT_TAG.CONSTANT_Methodref:
    case CONSTANT_TAG.CONSTANT_InterfaceMethodref:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.class_index, item.name_and_type_index]}/>
        <ConstantDesc desc={item.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_NameAndType:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.name_index, item.descriptor_index]}/>
        <ConstantDesc desc={item.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_String:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.string_index]}/>
        <ConstantDesc desc={item.string_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_MethodHandle:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.reference_index]}>
          <div>{item.reference_kind.value}&nbsp;</div>
        </ConstantAnchorList>
        <ConstantDesc desc={item.reference_kind.name + ' ' + item.reference_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_MethodType:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.descriptor_index]}/>
        <ConstantDesc desc={item.descriptor_index.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_Dynamic:
    case CONSTANT_TAG.CONSTANT_InvokeDynamic:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantAnchorList infoList={[item.name_and_type_index]}>
          <BootstrapMethodAnchor index={item.bootstrap_method_attr_index.value}/>
        </ConstantAnchorList>
        <ConstantDesc desc={item.name}/>
      </Constant>
    case CONSTANT_TAG.CONSTANT_Utf8:
    case CONSTANT_TAG.CONSTANT_Integer:
    case CONSTANT_TAG.CONSTANT_Long:
    case CONSTANT_TAG.CONSTANT_Float:
    case CONSTANT_TAG.CONSTANT_Double:
      return <Constant index={index}>
        <ConstantIndex index={index}/>
        <ConstantName tag={item.tag}/>
        <ConstantValue value={item.bytes.name || item.bytes.value}/>
      </Constant>
    default:
      throw new Error('unknown constant tag')
  }
}

const FieldAndMethod = ({item}: { item: any }) => {
  return <>
    <div>{item.name};</div>
    {item.attributes_count.value > 0
      ? <AttributesView attributes={item.attributes}/>
      : null}
  </>
}

const FieldsAndMethods = ({list}: { list: any }) => {
  return <ul className={'fields-and-methods'}>
    {list.map((item: any, index: number) => (
      <li className={'field-and-method'} key={index}><FieldAndMethod item={item}/></li>
    ))}
  </ul>
}

const Switch = ({tag, value}: { tag: string | number, value: number }) => {
  return <div className={'switch'}>
    <div className={'switch-tag'}>{tag}:</div>
    <div><OffsetAnchor offset={value}/></div>
  </div>
}
const Tableswitch = ({inst}: { inst: any }) => {
  const opcode = inst[0]
  const defaultOffset = inst[1]
  const low = inst[2]
  const high = inst[3]
  return <div className={'bytecode-tableswitch'}>
    <div className={'opcode-name'}>{`${opcode.name} { `} <span className={'gray'}>// {low.value} - {high.value}</span>
    </div>
    <ul>
      {inst.slice(4).map((item: any, index: number) => (
        <li key={index}><Switch tag={low.value + index} value={item.value}/></li>
      ))}
      <li><Switch tag={'default'} value={defaultOffset.value}/></li>
    </ul>
    <div>{'}'}</div>
  </div>
}

const Lookupswitch = ({inst}: { inst: any }) => {
  const opcode = inst[0]
  const defaultOffset = inst[1]
  const npars = inst[2]
  const list = []
  for (let i = 1; i <= npars.value; i += 1) {
    const item = inst[i + 2]
    list.push(<li key={i}><Switch tag={item[0].value} value={item[1].value}/></li>)
  }
  return <div className={'bytecode-lockupswitch'}>
    <div className={'opcode-name'}>{`${opcode.name} { `} <span className={'gray'}>// {npars.value}</span></div>
    <ul>
      {list}
      <li><Switch tag={'default'} value={defaultOffset.value}/></li>
    </ul>
    <div>{'}'}</div>
  </div>
}

const Bytecode = ({inst, baseOffset}: { inst: any, baseOffset: number }) => {
  const opcode = inst[0]
  const at = opcode.offset - baseOffset
  return <div className={'bytecode'} id={'offset-' + at}>
    <div className={'bytecode-offset'}>{at}</div>

    {opcode.name === 'tableswitch' ?
      <Tableswitch inst={inst}/> :
      opcode.name === 'lookupswitch' ?
        <Lookupswitch inst={inst}/> :
        <>
          <div className={'opcode-name'}>{opcode.name}</div>
          {inst.slice(1).map((operand: any, index: number) => {
            switch (operand.type) {
              case OPERAND_TYPES.constant_index1:
              case OPERAND_TYPES.constant_index2:
                return <Fragment key={index}>
                  <ConstantAnchor info={operand} />
                  <ConstantDesc desc={operand.name} />
                </Fragment>
              case OPERAND_TYPES.local_index1:
              case OPERAND_TYPES.local_index2:
                return <span key={index} className={'local-index'}>${operand.value}</span>
              case OPERAND_TYPES.branch_offset2:
              case OPERAND_TYPES.branch_offset4:
                return <OffsetAnchor key={index} offset={operand.value}/>
              default:
                return <div key={index} className={'operand-value'}>{operand.value}</div>
            }
          })}
        </>}
  </div>
}

const Attribute = ({item}: { item: any }) => {
  switch (item.attribute_name_index.name) {
    case 'Code':
      const baseOffset = item.code_length.offset + item.code_length.bytes
      return <>
        <div>{item.attribute_name_index.name}:</div>
        <ul className={'attribute-code'}>
          <li>max_stack={item.max_stack.value}, locals={item.max_locals.value}</li>
          {item.code.map((item: any, index: number) => (
            <li key={index}>
              <Bytecode inst={item} baseOffset={baseOffset}/>
            </li>
          ))}
        </ul>
      </>
    case 'ConstantValue':
      return <>
        <div>{item.attribute_name_index.name}</div>
        <div>{item.constantvalue_index.name}</div>
      </>
    case 'SourceFile':
      return <div>{item.attribute_name_index.name}: {item.sourcefile_index.name}</div>
    case 'InnerClasses':
      return <>
        <div>{item.attribute_name_index.name}({item.number_of_classes.value})</div>
        <ul>
          {item.classes.map((item: any, index: number) => (
            <li key={index} className={'flex-row'}>
              <div>(0x{item.inner_class_access_flags.value.toString(16)}) {item.inner_class_access_flags.name}&nbsp;</div>
              <ConstantAnchor info={item.inner_name_index} />=&nbsp;
              <ConstantAnchor info={item.inner_class_info_index} /> of&nbsp;
              <ConstantAnchor info={item.outer_class_info_index} />
              <ConstantDesc desc={`${item.inner_name_index.name} = class ${item.inner_class_info_index.name} of class ${item.outer_class_info_index.name}`} />
            </li>
          ))}
        </ul>
      </>
    case 'BootstrapMethods':
      return <>
        <div>{item.attribute_name_index.name}({item.num_bootstrap_methods.value})</div>
        <ul>
          {item.bootstrap_methods.map((item: any, index: number) => (
            <li key={index} id={`bootstrap-method-${index}`}>
              <div className={'flex-row'}>
                <div>{index}:&nbsp;</div>
                <ConstantAnchor info={item.bootstrap_method_ref} showDesc/>
              </div>
              <ul>
                Method arguments:
                {item.bootstrap_arguments.map((item: any, index: number) => (
                  <li key={index}>
                    <ConstantAnchor info={item} showDesc/>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </>
    default:
      return null
  }
}

const AttributesView = ({attributes}: { attributes: any }) => {
  return <ul className={'attributes'}>
    {attributes.map((item: any, index: number) => (
      <li key={index}>
        <Attribute item={item}/>
      </li>
    ))}
  </ul>
}

const Toggle = ({children}: { children: any }) => {
  const [show, setShow] = useState<boolean>(true)
  return <>
    {/*<button onClick={() => setShow(!show)}>{show ? '-' : '+'}</button>*/}
    {show ? children : null}
  </>
}

export const ClassFileView = ({data}: { data: any }) => {
  return <div className={'class-file-box'}>
    <div>version: {data.version.major.value}.{data.version.minor.value}</div>
    <div>access_flags: (0x{data.access_flags.value.toString(16)}) {data.access_flags.name}</div>
    <div className={'flex-row'}>this_class:&nbsp;<ConstantAnchor info={data.this_class} showDesc/></div>
    {data.super_class.value > 0 ?
      <div className={'flex-row'}>super_class:&nbsp;<ConstantAnchor info={data.super_class} showDesc/></div> : null}
    <div>
      <div className={'strong'}>interfaces({data.interfaces_count.value}):</div>
      <ul>
        {data.interfaces.map((item: any, index: number) => (
          <li key={index}><ConstantAnchor info={item} showDesc/></li>
        ))}
      </ul>
    </div>

    <div>
      <div className={'strong'}>fields({data.fields_count.value}):</div>
      <FieldsAndMethods list={data.fields}/>
    </div>


    <div>
      <div className={'strong'}>methods({data.methods_count.value}):</div>
      <FieldsAndMethods list={data.methods}/>
    </div>

    <div>
      <div className={'strong'}>constant_pool({data.constant_pool_count.value - 1}):</div>
      <ul className={'constant-pool diver'}>
        {data.constant_pool.filter((item: any) => item).map((item: any, index: number) => (
          <li key={index}><ConstantView item={item} index={index}/></li>
        ))}
      </ul>
    </div>

    <div>
      <div className={'strong'}>attributes({data.attributes_count.value}):</div>
      <Toggle><AttributesView attributes={data.attributes}/></Toggle>
    </div>
  </div>
}


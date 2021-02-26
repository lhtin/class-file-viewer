import {useCallback, useRef, useState} from 'react';
import { ClassFileView } from './parser/Component'
import {Parser} from "./parser/parser";

const getUint8Array = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

const Panel = ({onParse}: {onParse: (file: File) => void}) => {
  const [name, setName] = useState<string>(localStorage.getItem('class-file-name') || '')
  const inputEl = useRef<HTMLInputElement | null>(null);
  const onClick = useCallback(() => {
    const file = inputEl?.current?.files?.[0]
    if (file) {
      localStorage.setItem('class-file-name', file.name)
      onParse(file)
    }
  }, [inputEl, onParse])
  const onChange = useCallback((e) => {
    const file = inputEl?.current?.files?.[0]
    if (file) {
      setName(file.name)
    }
  }, [inputEl])
  return <>
    <div className={'panel flex-row flex-align-center'}>
      <label htmlFor={'file-select'} className={'button'}>选择文件</label>
      <input
        id={'file-select'}
        ref={inputEl}
        type={'file'}
        accept={'.class'}
        onChange={onChange}
      />
      <div className={'button'} onClick={onClick}>开始解析</div>
    </div>
    {name ? <div>{name}</div> : null}
  </>
}

const getCachedData = () => {
  const cachedData = localStorage.getItem('class-file-data') || ''
  try {
    const data = JSON.parse(cachedData)
    console.log('use cached class file data')
    return data
  } catch (e) {
    return null
  }
}

const App = () => {
  const [data, setData] = useState<any>(getCachedData())
  const onParse = useCallback(async (file) => {
    const u = await getUint8Array(file)
    const data = new Parser(u).getData()
    localStorage.setItem('class-file-data', JSON.stringify(data))
    setData(data);
  }, [setData])
  return (
    <div className={'flex-column flex-align-center app'}>
      <Panel onParse={onParse} />
      {data ? <ClassFileView data={data} /> : null}
      <a href={'https://github.com/lhtin/class-file-viewer'}>GitHub</a>
    </div>
  )
}

export default App;

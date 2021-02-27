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
  const onChange = useCallback((e) => {
    const file = inputEl?.current?.files?.[0]
    if (file) {
      setName(file.name)
      localStorage.setItem('class-file-name', file.name)
      onParse(file)
    }
  }, [inputEl, onParse])
  return <>
    <div className={'panel flex-row flex-align-center'}>
      <label htmlFor={'file-select'} className={'button'}>select class file to view</label>
      <input
        id={'file-select'}
        ref={inputEl}
        type={'file'}
        accept={'.class'}
        onChange={onChange}
      />
    </div>
    {name ? <div>{name}</div> : null}
  </>
}

const getCachedData = () => {
  const cachedData = localStorage.getItem('class-file-data')
  try {
    if (cachedData) {
      console.log('use cached class file data')
      const data = new Parser(Uint8Array.of(...cachedData.split(',').map((item) => Number(item)))).getData()
      return data
    }
  } catch (e) {
    return null
  }
}

const App = () => {
  const [data, setData] = useState<any>(getCachedData())
  const onParse = useCallback(async (file) => {
    const u = await getUint8Array(file)
    localStorage.setItem('class-file-data', u.toString())
    const data = new Parser(u).getData()
    setData(data);
  }, [setData])
  return (
    <div className={'flex-column flex-align-center app'}>
      <Panel onParse={onParse} />
      {data
        ? <>
          <ClassFileView data={data} />
          <a className={'link'} href={'https://github.com/lhtin/class-file-viewer'}>GitHub</a>
        </>
        : null}

    </div>
  )
}

export default App;

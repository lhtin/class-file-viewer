import { useState } from 'react';
import { ClassFileView } from './parser/Component'
import {Parser} from "./parser/parser";

const getUint8Array = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

const App = () => {
  const [data, setData] = useState<any>(null)
  console.log(data)
  return (
    <div className="App">
      <input type={'file'} accept={'.class'} onChange={async (event) => {
        if (event?.target?.files?.[0]) {
          const u = await getUint8Array(event.target.files[0])
          setData(new Parser(u).getData())
        }
      }} />
      {data ? <ClassFileView data={data} /> : null}
    </div>
  )
}

export default App;

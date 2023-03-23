import { useEffect, useRef, useState } from 'react'
import { Input } from 'antd'
import 'antd/dist/reset.css';

const { TextArea } = Input

// 随机生成当前用户ID
const userId = `user${Math.round(Math.random() * 10)}`;
// 连接websocket
const ws = new WebSocket('ws://localhost:3030')
ws.onopen = () => {
  // 注册用户
  ws.send(JSON.stringify({
    type: 'identity',
    data: { userId },
  }))
}

// 当前光标
let curCursor = 0
let cursorMoveLock = false

function Doc() {
  // 文档内容
  const [docValue, setDocValue] = useState('')
  // 其他用户光标
  const [otherCursor, setOtherCursor] = useState({})
  // 文档ref
  const docRef = useRef()
  // 处理同步信息
  ws.onmessage = event => {
    // console.log("🚀 ~ file: doc.js:21 ~ Doc ~ event:", event.data.toString())
    const message = JSON.parse(event.data)
    if (message.type === 'document') {
      // 保障当前光标位置不变
      cursorMoveLock = true
      // 文档内容同步
      updateDocument(message.data)
    } else if (message.type === 'cursor') {
      // 其他用户光标位置同步
      updateCursor(message.data)
    }
  }

  // 获取当前光标
  const getCursorPosition = () => {
    return docRef.current.resizableTextArea.textArea.selectionStart
  }
  // 设置光标位置
  const setCursorPosition = (pos) => {
    docRef.current.resizableTextArea.textArea.setSelectionRange(pos, pos)
  }

  // 文档更新
  const updateDocument = data => {
    // 处理文档变化逻辑
    setDocValue(data)
  }
  // 虚拟光标更新
  const updateCursor = data => {
    // 获取历史用户光标
    const otherCursorTmp = JSON.parse(JSON.stringify(otherCursor))
    // 更新获取到的用户光标
    otherCursorTmp[data.userId] = data.cusPos
    setOtherCursor(otherCursorTmp)
  }

  // 响应文档变更
  const handleDocumentEdit = el => {
    // 变更文档内容展示
    const elValue = el.value
    setDocValue(elValue)
    // 发送最新文档内容
    ws.send(JSON.stringify({
      type: 'document',
      data: elValue
    }))
  }

  // 文档内容变更保持光标不变
  useEffect(() => {
    if (cursorMoveLock) {
      setCursorPosition(curCursor)
      cursorMoveLock = false
    }
  }, [docValue])

  // 初始化
  useEffect(() => {
    // 监听光标位置信息
    document.addEventListener('selectionchange', e => {
      // 发送光标位置信息
      ws.send(JSON.stringify({
        type: 'cursor',
        data: {
          userId,
          cusPos: getCursorPosition()
        }
      }))
      // 记录光标位置
      curCursor = getCursorPosition()
    })
  }, [])
  return (
    <div>
      <h1>current user: {userId}</h1>
      <TextArea
        ref={docRef}
        rows={4}
        onChange={event => {
          handleDocumentEdit(event.target)
        }}
        value = {docValue}
      />
      {Object.entries(otherCursor).length > 0 && (
        <div>其他用户光标位置:</div>
      )}
      {
        Object.entries(otherCursor).map(([userId, cusPos]) => (
          <div key={userId}>{userId}: {cusPos}</div>
        ))
      }
    </div>
  );
}

export default Doc;

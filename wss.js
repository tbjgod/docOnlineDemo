const WebSocket = require('ws')
// 启动websocket服务
const wss = new WebSocket.Server({ port: 3030 })

// 连接的用户
const wsUsers = {};
wss.on('connection', ws => {
  ws.on('message', message => {
    const data = JSON.parse(message.toString())
    if (data.type === 'identity') {
      // 记录用户身份信息
      wsUsers[data.data.userId] = ws
    } else if (['document', 'cursor'].includes(data.type)) {
      // 变更的内容同步到其他用户
      Object.entries(wsUsers).forEach(([userId, userWs]) => {
        if (userWs !== ws) {
          userWs.send(message.toString())
        }
      })
    }
  })
})

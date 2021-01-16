import express from 'express'
import {join} from 'path'
import { CustomEvent, Client } from './types'
import { nanoid } from 'nanoid'

const app = express()
app.use(express.json())

let clients: Client[] = []

app.get('/events', (req, res) => {
  console.log(req.headers)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  })

  const client: Client = {
    id: nanoid(),
    res
  }
  sendEventToAll({
    type: 'join',
    data: {
      joined: client.id
    },
    id: nanoid(10)
  })
  clients.push(client)

  req.on('close', () => {
    console.log(`connection closed by client ${client.id}`)
    clients = clients.filter(c => c.id !== client.id)
  })
  // see that we don’t do res.json() or res.send() here
})

app.post('/generate', (req, res) => {
  const { body } = req

  const myEvent: CustomEvent = {
    data: body.data,
    type: body.type,
    id: nanoid(10),
    retry: 10000
  }
  sendEventToAll(myEvent)
  res.json({})
})

// static
app.use(express.static(join(__dirname, '../public')))

const PORT = +process.env.PORT! || 3000
app.listen(PORT, () => console.log(`> http://localhost:${PORT}`))

function sendEventToAll(event: CustomEvent) {
  console.log('sending event', event)
  clients.forEach(c => {
    let eventString = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n`
    if(event.retry) {
      eventString += `retry: ${event.retry}\n`
    }
    eventString += `id: ${event.id}\n\n`
    c.res.write(eventString)
  })
}

import React, { useState, useEffect } from 'react'
import { PrivateKey, Client, ThreadID } from '@textile/hub'
import { Button, Header, Segment } from 'semantic-ui-react'

import Table from './Table'

import 'semantic-ui-css/semantic.min.css'
import './App.css'

const App = () => {
  const [client, setClient] = useState<Client>()
  const [threadId, setThreadId] = useState<ThreadID>()
  const [name, setName] = useState<string>('')
  const [table, showTable] = useState<boolean>(false)
  const [collections, setCollections] = useState<Array<any>>()

  useEffect(() => {
    const setup = async () => {
      const keyInfo = { key: 'bs3g66aciasarrm46kosxap74te' }
      const newIdentity = await getIdentity()

      const client = await Client.withKeyInfo(keyInfo)
      await client.getToken(newIdentity)
      setClient(client)
      // console.log('LLL', await client.listThreads())
      const collections = await client.listCollections(ThreadID.fromString('bafkypcdo2yzg7ydabdfp5op364htx6oratoobmivkkql6z3ii4lqkry'))
      setCollections(collections)
      // const threadId = await client.newDB()
      const threadId = ThreadID.fromString('bafkypcdo2yzg7ydabdfp5op364htx6oratoobmivkkql6z3ii4lqkry')
      setThreadId(threadId)
    }
    setup()
  }, [])


  const getIdentity = async (): Promise<PrivateKey> => {
    try {
      var storedIdent = localStorage.getItem('identity')
      if (storedIdent === null) {
        throw new Error('No identity')
      }
      const restored = PrivateKey.fromString(storedIdent)
      return restored
    }
    catch (e) {
      try {
        const identity = PrivateKey.fromRandom()
        const identityString = identity.toString()
        localStorage.setItem('identity', identityString)
        return identity
      } catch (err) {
        return err.message
      }
    }
  }

  const selectExisting = (name: string) => {
    setName(name)
    showTable(true)
  }

  return (
    <div className='App'>
      <Segment.Group style={{ height: '100%', border: 0, boxShadow: '0px 0px 0px', borderRadius: 0 }}>
        <Segment clearing className='nav'>
          <Header className='avatar' as='h2' floated='left'>
            <div className='avatar' onClick={() => window.location.reload()}>
              |<span aria-label='4.0 stars out of 5, 123 ratings' role='img'>🍣</span>
              |<span aria-label='4.0 stars out of 5, 123 ratings' role='img'>🍣</span>|
            </div>
          </Header>
        </Segment>
        {!table && (
          <div className='optionsRow'>
            <div className="inputContainer">
              <input className='nameInput' placeholder='table name' type='text' value={name} onChange={e => setName(e.target.value)}/>
              <Button className='ui primary button' onClick={() => showTable(true)}>Create</Button>
            </div>
            {collections && collections.map((collection, index) => (
              <Button
                key={index}
                className='tableButton'
                onClick={() => selectExisting(collection.name)}
              >
                Table: {collection.name}
              </Button>
            ))}
          </div>
        )}
        {threadId && client && table && (
          <Table threadId={threadId} client={client} name={name}/>
        )}
      </Segment.Group>
    </div>
  )
}

export default App

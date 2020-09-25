// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useTable, usePagination, TableInstance } from 'react-table'
import { Client, ThreadID } from '@textile/hub'
import './Table.css'

type TableProps = {
  threadId: ThreadID,
  client: Client,
  name: string
}

type EditabeCellProps = {
  value: any,
  row: any,
  column: any,
  updateMyData: any
}

type Data = object

const Table = ({ threadId, client, name }: TableProps) => {
  const [schema, setSchema] = useState({
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: name,
    type: 'object',
    properties: {
      _id: { type: 'string' },
      name: { type: 'string' },
      missions: {
        type: 'number',
        minimum: 0,
      },
    },
  })

  const [columns, setColumns] = useState([
      {
        Header: name,
        columns: [
          {
            Header: 'Name',
            accessor: 'name',
          },
          {
            Header: 'Missions',
            accessor: 'missions',
          },
        ],
      },
    ],
  )
  const emptyRowObject = { _id: Math.random().toString(36), name: "", missions: 0 }
  const [data, setData] = useState([emptyRowObject])
  const [skipPageReset, setSkipPageReset] = useState(false)

  useEffect(() => {
    const existingCollection = async () => {
      const clientInfo = await client.getCollectionInfo(threadId, name)
      setSchema(clientInfo.schema)
      const list = await client.find(threadId, name, {})
      setData(list.instancesList)
    }
    existingCollection().catch(async () => {
      await client.newCollection(threadId, name, schema)
      await client.create(threadId, name, data)
    })
  }, [])

  useEffect(() => {
    if (data.length > 1) {
      saveCollectionUpdates()
    }
  }, [data])

  const updateMyData = async (rowIndex: number, columnId: string, value: any) => {
    setSkipPageReset(true)
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          }
        }
        return row
      })
    )
  }

  const saveCollectionUpdates = async () => {
    await client.save(threadId, name, data)
  }

  const addRow = () => {
    setData([...data, emptyRowObject])
    client.create(threadId, name, [emptyRowObject])
  }

  // const removeRow = async (instanceId: string) => {
  //   client.delete(threadId, name, [instanceId])
  // }

  const addColumn = async () => {
    const newColData = { Header: 'Field', accessor: 'field' }
    setColumns(old =>
      old.map((row) => {
        return {
          Header: name,
          columns: [...row.columns, newColData]
        }
      })
    )
    // @ts-ignore
    schema.properties.field = { type: 'string' }
    client.updateCollection(threadId, name, schema)
  }

  const EditableCell = ({
    value: initialValue,
    row: { index },
    column: { id },
    updateMyData,
  }: EditabeCellProps) => {
    const [value, setValue] = React.useState(initialValue)

    const onChange = (e: any) => {
      setValue(e.target.value)
    }

    const onBlur = () => {
      updateMyData(index, id, value)
    }

    useEffect(() => {
      setValue(initialValue)
    }, [initialValue])

    return (<input value={value} onChange={onChange} onBlur={onBlur} />)
  }

  const defaultColumn = {
    Cell: EditableCell,
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable<Data>(
    {
      columns,
      data,
      defaultColumn,
      autoResetPage: !skipPageReset,
      updateMyData,
    },
    usePagination
  ) as TableInstance<object>

  useEffect(() => {
    setSkipPageReset(false)
  }, [data])

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row: any) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell: any) => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <button onClick={addRow}>
        add row
      </button>
      <button onClick={addColumn}>
        add column
      </button>
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

export default Table

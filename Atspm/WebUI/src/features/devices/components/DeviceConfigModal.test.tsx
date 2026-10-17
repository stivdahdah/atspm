import type { DeviceConfiguration } from '@/api/config'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import DeviceConfigModal from './DeviceConfigModal'

jest.mock('@/features/products/api', () => ({
  useGetProducts: () => ({ data: { value: [{ id: 1, model: 'Controller' }] } }),
}))
jest.mock('@/api/config', () => ({
  ...jest.requireActual('@/api/config'),
  useGetDeviceConfigurationEventLogDecoders: () => ({ data: { value: [] } }),
}))
jest.mock('@/hooks/useConfigEnums', () => ({
  ConfigEnum: { TransportProtocols: 'TransportProtocols' },
  useConfigEnums: () => ({ data: protocols }),
}))
const protocols = [{ name: 'FTP', value: 0 }]
const data: DeviceConfiguration = {
  id: 1,
  description: 'Controller',
  protocol: 0,
  port: 21,
  path: '/logs',
  query: ['[DeviceIdentifier]'],
  connectionTimeout: 10,
  operationTimeout: 10,
  productId: 1,
  loggingOffset: 0,
  decoders: [],
  userName: '',
  password: '',
}

it('round-trips query strings and protocol zero, and waits for saving before closing', async () => {
  let finish!: () => void
  const onSave = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      })
  )
  const onClose = jest.fn()
  render(
    <DeviceConfigModal data={data} isOpen onSave={onSave} onClose={onClose} />
  )
  fireEvent.change(screen.getByDisplayValue('[DeviceIdentifier]'), {
    target: { value: '[Ipaddress]' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        protocol: 0,
        query: ['[Ipaddress]'],
        loggingOffset: 0,
      })
    )
  )
  expect(onClose).not.toHaveBeenCalled()
  finish()
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
})
it('keeps the form open when saving fails', async () => {
  const onSave = jest.fn().mockRejectedValue(new Error('save failed')),
    onClose = jest.fn()
  const log = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  try {
    render(
      <DeviceConfigModal data={data} isOpen onSave={onSave} onClose={onClose} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(log).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  } finally {
    log.mockRestore()
  }
})

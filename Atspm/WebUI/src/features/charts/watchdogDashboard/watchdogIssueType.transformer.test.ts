import transformWatchdogIssueTypeData from './watchdogIssueType.transformer'

const data = [{
  issueType: 1,
  name: 'MissingData',
  products: [{ name: 'Controller', model: [{ name: 'Model A', firmware: [
    { name: '1.0', counts: 3 }, { name: '2.0', counts: 1 },
  ] }] }],
}]

it('preserves product, model and firmware counts in the WatchDog sunburst', () => {
  const result = transformWatchdogIssueTypeData(data)
  expect(result.legendData).toEqual([
    expect.objectContaining({ name: 'MissingData', selected: true }),
  ])
  expect(result.sunburst.series).toMatchObject([{
    type: 'sunburst',
    data: [{
      name: 'MissingData\n100.0%',
      children: [{ name: 'Controller', children: [{ name: 'Model A', children: [
        { name: '1.0\n75.0%', value: 3 }, { name: '2.0\n25.0%', value: 1 },
      ] }] }],
    }],
  }])
})

it('retains deselected issues in the legend while excluding their chart nodes', () => {
  const result = transformWatchdogIssueTypeData(data, ['MissingData'])
  expect(result.legendData).toEqual([
    expect.objectContaining({ name: 'MissingData', selected: false }),
  ])
  expect(result.sunburst.series).toMatchObject([{ type: 'sunburst', data: [] }])
})

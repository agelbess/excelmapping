const assert = require('assert')
const m = require('..')
const fs = require('fs')

const PATH = './target/test_map2xlsx'

fs.rmdir(PATH, () => (err) => {
    if (err) throw err;
})
fs.mkdir(PATH, {recursive: true}, (err) => {
    if (err) throw err;
})

describe('test writing single excel file from map', () => {
    const filepath = PATH + '/test1.xlsx'
    const data = {
        out: [
            {f1: 'out-o1-f1'},
            {f1: 'out-o2-f1'}
        ]
    }
    const config = [
        {
            path: filepath,
            dataName: 'out'
        },
        {
            path: filepath,
            dataName: 'out',
            sheetName: 'out1'
        }
    ]

    it('should write a sheet as `out` and another as `out1`', () => {
        m.map2xlsx(data, config)

        let readData = m.xlsx2map([
            {
                path: filepath,
                sheets: [{sheetName: 'out'}, {sheetName: 'out1'}]
            }
        ])
        assert.strictEqual(readData.out.length, 2)
        assert.strictEqual(readData.out[0].f1, 'out-o1-f1')
        assert.strictEqual(readData.out[1].f1, 'out-o2-f1')

        assert.strictEqual(readData.out1.length, 2)
        assert.strictEqual(readData.out1[0].f1, 'out-o1-f1')
        assert.strictEqual(readData.out1[1].f1, 'out-o2-f1')
    })
})

describe('test writing multiple excel file from map', () => {
    const filepath1 = PATH + '/test2_1.xlsx'
    const filepath2 = PATH + '/test2_2.xlsx'
    const data = {
        out1: [{f1: 'out1-o1-f1'}],
        out2: [{f1: 'out2-o1-f1'}],
        out3: [{f1: 'out3-o1-f1'}]
    }
    const config = [
        {
            path: filepath1,
            dataName: 'out1'
        },
        {
            path: filepath2,
            dataName: 'out1'
        },
        {
            path: filepath1,
            dataName: 'out2'
        },
        {
            path: filepath2,
            dataName: 'out2'
        },
        {
            path: filepath2,
            dataName: 'out3'
        }
    ]

    it('should write to file1 sheets `out1` and `out2, and to file2 `out1`, `out2` and `out3`', () => {
        m.map2xlsx(data, config)

        let readData1 = m.xlsx2map([
            {
                path: filepath1,
                sheets: [{sheetName: 'out1'}, {sheetName: 'out2'}]
            }
        ])
        assert.strictEqual(readData1.out1.length, 1)
        assert.strictEqual(readData1.out1[0].f1, 'out1-o1-f1')
        assert.strictEqual(readData1.out2.length, 1)
        assert.strictEqual(readData1.out2[0].f1, 'out2-o1-f1')

        let readData2 = m.xlsx2map([
            {
                path: filepath2,
                sheets: [{sheetName: 'out1'}, {sheetName: 'out2'}, {sheetName: 'out3'}]
            }
        ])
        assert.strictEqual(readData2.out1.length, 1)
        assert.strictEqual(readData2.out1[0].f1, 'out1-o1-f1')
        assert.strictEqual(readData2.out2.length, 1)
        assert.strictEqual(readData2.out2[0].f1, 'out2-o1-f1')
        assert.strictEqual(readData2.out3.length, 1)
        assert.strictEqual(readData2.out3[0].f1, 'out3-o1-f1')
    })
})

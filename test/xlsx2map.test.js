const assert = require('assert')
const m = require('..')

const filepath = './test/gods.xlsx'

describe('test reading excel files to map', () => {
    const config = [{
        path: filepath,
        sheets: [{sheetName: 'Gods in English'}]
    }]

    it('should read the first sheet', () => {
        let data = m.xlsx2map(config)
        assert.strictEqual(data['Gods in English'].length, 14)
    })
    it('first row contains name and sex', () => {
        let data = m.xlsx2map(config)
        assert.strictEqual(data['Gods in English'][0].name, 'Aphrodite')
        assert.strictEqual(data['Gods in English'][0].sex, 'female')
    })
})

describe('test data.name', () => {
    it('data name is same as sheet name', () => {
        const config = [{
            path: filepath,
            sheets: [{sheetName: 'Gods in English'}]
        }]
        let data = m.xlsx2map(config)
        assert.strictEqual(data['Gods in English'] !== undefined, true)
        assert.strictEqual(data.s1 !== undefined, false)
    })
    it('data name is not the same as sheet name', () => {
        const config = [{
            path: filepath,
            sheets: [{sheetName: 'Gods in English', dataName: 's1'}]
        }]
        let data = m.xlsx2map(config)
        assert.strictEqual(data['Gods in English'] !== undefined, false)
        assert.strictEqual(data.s1 !== undefined, true)
    })
})

describe('test from multiple files and sheets', () => {
    const config = [
        {
            path: filepath,
            sheets: [
                {
                    sheetName: 'Gods in English',
                    dataName: 's1'
                },
                {
                    sheetName: 'Gods in Greek',
                    dataName: 's2'
                }
            ]
        },
        {
            path: filepath,
            sheets: [
                {
                    sheetName: 'Gods in English',
                    dataName: 's3'
                }
            ]
        }
    ]
    it('read from 2 files and 3 sheets', () => {
        let data = m.xlsx2map(config)
        assert.strictEqual(data.s1.length, 14)
        assert.strictEqual(data.s1[0].name, 'Aphrodite')
        assert.strictEqual(data.s2.length, 14)
        assert.strictEqual(data.s2[0]['όνομα'], 'Αφροδίτη')
        assert.strictEqual(data.s3.length, 14)
        assert.strictEqual(data.s3[0].name, 'Aphrodite')
    })
})

describe('test range', () => {
    it('no range set, not needed', () => {
        const config = [{
            path: filepath,
            sheets: [{sheetName: 'Custom Range Not Needed', dataName:'s1'}]
        }]
        let data = m.xlsx2map(config);
        assert.strictEqual(data.s1.length, 14)
    })
    it('set range is needed, otherwise result cannot be easily evaluated', () => {
        const config = [{
            path: filepath,
            sheets: [{sheetName: 'RangeFrom Needed', dataName:'s1'}]
        }]
        let data = m.xlsx2map(config);
        assert.notStrictEqual(data.s1.length, 14)
    })
    it('set rangeFrom', () => {
        const config = [{
            path: filepath,
            sheets: [{sheetName: 'RangeFrom Needed', dataName:'s1', rangeFrom: 'D4'}]
        }]
        let data = m.xlsx2map(config);
        assert.strictEqual(data.s1.length, 14)
    })
    it('set rangeTo', () => {
        const config = [{
            path: filepath,
            sheets: [{sheetName: 'Gods in English', dataName:'s1', rangeTo: 'B3'}]
        }]
        let data = m.xlsx2map(config);
        assert.strictEqual(data.s1.length, 2)
    })
    it('set rangeFromAndTo', () => {
        const config = [{
            path: filepath,
            sheets: [{sheetName: 'RangeFrom Needed', dataName:'s1', rangeFrom: 'D4', rangeTo: 'E7'}]
        }]
        let data = m.xlsx2map(config);
        assert.strictEqual(data.s1.length, 3)
        assert.strictEqual(data.s1[2].name, 'Ares')
    })
})

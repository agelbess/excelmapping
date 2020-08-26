const assert = require('assert')
const m = require('..')
const fs = require('fs')

const PATH = './target/test_gods'

fs.rmdir(PATH, () => (err) => {
    if (err) throw err;
})
fs.mkdir(PATH, {recursive: true}, (err) => {
    if (err) throw err;
})

describe('create a list of male Gods in English and in Greek', () => {
    it('test', () => {

        let collections = {}
        m.map(collections, [
            // load the 2 sheets
            {
                name: 'Gods in English',
                jobs: [
                    {load: {path: './test/gods.xlsx'}},
                    {filterObjects: [{field: 'sex', include: ['male']}]},
                    {copyTo: 'Male God names'}
                ]
            },
            {
                name: 'Gods in Greek',
                jobs: [
                    {load: {path: './test/gods.xlsx'}},
                    {filterObjects: [{field: 'φύλο', include: ['αρσενικό']}]},
                    {mapFields: {['όνομα']: 'name'}},
                    {copyTo: 'Male God names'}
                ]
            },
            {
                name: 'Male God names',
                jobs: [
                    {filterFields: {include: ['name']}},
                    {save: {path: PATH + '/maleGodNames.xlsx'}}
                ]
            }
        ])

        const loadConfig = {
            name: 'Male God names',
            jobs: [{load: {path: PATH + '/maleGodNames.xlsx'}}]
        }
        let loadCollections = {}
        m.map(loadCollections, loadConfig)
        assert.strictEqual(loadCollections['Male God names'].length, 8 + 8)
    })
})

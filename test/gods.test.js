const assert = require('assert')
const m = require('..')
const fs = require('fs')

const PATH = './target/test_gods'

try {
    fs.rmdirSync(PATH)
} catch (e) {
}
fs.mkdirSync(PATH, {recursive: true})

describe('create a list of male Gods in English and in Greek', () => {
    it('test', () => {

        const config = [
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
                    {mapFields: [{from: 'όνομα', to: 'name'}]},
                    {copyTo: 'Male God names'}
                ]
            },
            {
                name: 'Male God names',
                jobs: [
                    {filterFields: {include: ['name']}},
                    {save: {path: PATH + '/maleGodNames.xlsx'}}
                ]
            },
            {
                name: 'Gods power',
                jobs: [
                    {load: {path: './test/gods.xlsx'}}
                ]
            },
            {
                name: 'Gods in English',
                jobs: [
                    {mergeObjects: {name: 'Gods power', key: ['name']}}
                ]
            }
        ]
        let collections = m.map(config)
        assert.strictEqual(collections['Male God names'].length, 8 + 8)
        assert.strictEqual(collections['Gods in English'][0].name, 'Apollo')
        assert.strictEqual(collections['Gods in English'][0].power, 'light')
    })
})

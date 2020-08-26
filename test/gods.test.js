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
        // load the 2 sheets
        let collections = m.xlsx2map([
            {
                path: './test/gods.xlsx',
                sheets: [
                    {sheetName: 'Gods in English'},
                    {sheetName: 'Gods in Greek'}
                ]
            }
        ])
        // filter by sex
        m.map(collections, {
            'Gods in English': {
                filterObjects: {
                    sex: {
                        include: ['male']
                    }
                }
            },
            'Gods in Greek': {
                filterObjects: {
                    ['φύλο']: {
                        include: ['αρσενικό']
                    }
                }
            }
        })
        // change the Greek field to English, otherwise cannot merge
        m.map(collections, {
            'Gods in Greek': {
                mapFields: {
                    ['όνομα']: 'name'
                }
            }
        })
        // merge the collections
        m.map(collections, {
            'Gods in English': {
                copyTo: 'Male God names'
            },
            'Gods in Greek': {
                copyTo: 'Male God names'
            }
        })
        // remove the sex fields
        m.map(collections, {
            'Male God names': {
                filterFields: {
                    include: ['name']
                }
            }
        })
        m.map2xlsx(collections, [
                {
                    dataName: 'Male God names',
                    path: PATH + '/maleGodNames.xlsx'
                }
            ]
        )
        assert.strictEqual(collections['Male God names'].length, 8 + 8)
    })
})

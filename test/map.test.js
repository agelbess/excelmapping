const assert = require('assert')
const m = require('..')
const fs = require('fs')

const TARGET_PATH = './target/test_map'

try {
    fs.rmdirSync(TARGET_PATH)
} catch (e) {
}
fs.mkdirSync(TARGET_PATH, {recursive: true})

const newCollections = function () {
    return {
        in1: [
            {f1: 'in1-o1-f1'},
            {f1: 'in1-o2-f1'}
        ],
        in2: [
            {f1: 'in2-o1-f1'},
            {f1: 'in2-o2-f1'}
        ],
        in3: [
            {f1: 'in3-o1-f1', f2: 'in3-o1-f2'},
            {f1: 'in3-o2-f1', f2: 'in3-o2-f2'},
            {f1: 'in3-o3-f1', f2: 'in3-o3-f2'},
            {f1: 'in3-o4-f1', f2: 'in3-o4-f2'},
            {f1: 'in3-o5-f1', f2: 'in3-o5-f2'},
            {f1: 'in3-o6-f1', f2: 'in3-o6-f2'}
        ],
        in4: [
            {f1: 'in4-o1-f1', f2: 'in4-o1-f2', f3: 'in4-o1-f3'},
            {f1: 'in4-o2-f1', f2: 'in4-o2-f2', f3: 'in4-o2-f3'}
        ],
        array1: [
            'f1', 'f3'
        ],
        map1: [
            {from: 'f2', to: 's2'}
        ]
    }
}

describe('test mapYamlFile', () => {
    it('test', () => {
        let collections = m.mapYamlFile('./test/mapYamlFile.yaml', newCollections())
        assert.strictEqual(collections.copied.length, 2)
    })
})

describe('test load', () => {
    it('test', () => {
        const config = {
            name: 'Gods in English',
            jobs: [{
                load: {
                    path: './test/gods.xlsx'
                }
            }]
        }
        let collections = m.map(config)
        assert.strictEqual(collections['Gods in English'].length, 14)
    })

    it('test with sheetName', () => {
        const config = {
            name: 'in1',
            jobs: [{
                load: {
                    path: './test/gods.xlsx',
                    sheetName: 'Gods in English'
                }
            }]
        }
        let collections = m.map(config)
        assert.strictEqual(collections.in1.length, 14)
    })

    it('test with rangeFrom (not needed since the library handles it)', () => {
        const config = {
            name: 'in1',
            jobs: [{
                load: {
                    path: './test/gods.xlsx',
                    sheetName: 'RangeFrom not needed'
                }
            }]
        }
        let collections = m.map(config)
        assert.strictEqual(collections.in1.length, 14)
    })

    it('test with rangeFrom', () => {
        const config = {
            name: 'in1',
            jobs: [{
                load: {
                    path: './test/gods.xlsx',
                    sheetName: 'RangeFrom needed',
                    rangeFrom: 'D4'
                }
            }]
        }
        let collections = m.map(config)
        assert.strictEqual(collections.in1.length, 6)
        assert.strictEqual(collections.in1[0].name, 'Aphrodite')
        assert.strictEqual(collections.in1[0].sex, 'female')
    })

    it('test with rangeFrom and rangeTo (ignoring column `sex`)', () => {
        const config = {
            name: 'in1',
            jobs: [{
                load: {
                    path: './test/gods.xlsx',
                    sheetName: 'RangeFrom needed',
                    rangeFrom: 'D4',
                    rangeTo: 'D9'
                }
            }]
        }
        let collections = m.map(config)
        assert.strictEqual(collections.in1.length, 5)
        assert.strictEqual(collections.in1[0].name, 'Aphrodite')
        assert.strictEqual(collections.in1[0].sex, undefined)
    })

    it('test load json', () => {
        const config = {
            name: 'load',
            jobs: [{load: {path: './test/load.json'}}]
        }

        let collections = m.map(config)
        assert.strictEqual(collections.load.length, 3)
    })
})

describe('test save', () => {
    it('test', () => {
        const filepath = TARGET_PATH + '/test_save.xlsx'
        const config = {
            name: 'in1',
            jobs: [{save: {path: filepath}}]
        }
        let collections = newCollections()
        m.map(config, collections)

        let loadCollections = {}
        const loadConfig = {
            name: 'in1',
            jobs: [{load: {path: filepath}}]
        }
        m.map(loadConfig, loadCollections)
        assert.strictEqual(loadCollections.in1.length, 2)
    })

    it('test with sheetName', () => {
        const filepath = TARGET_PATH + '/test_save.xlsx'
        const config = {
            name: 'in1',
            jobs: [{save: {path: filepath, sheetName: 'out1'}}]
        }
        let collections = newCollections()
        m.map(config, collections)

        let loadCollections = {}
        const loadConfig = {
            name: 'out1',
            jobs: [{load: {path: filepath}}]
        }
        m.map(loadConfig, loadCollections)
        assert.strictEqual(loadCollections.out1.length, 2)
    })
})

describe('test copyTo', () => {
    it('single collection', () => {
        const config = {
            name: 'in1',
            jobs: [{copyTo: 'out1'}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.out1.length, 2)
        assert.strictEqual(collections.out1[0].f1, 'in1-o1-f1')
        assert.strictEqual(collections.out1[1].f1, 'in1-o2-f1')
    })

    it('multiple collections', () => {
        const config = [
            {name: 'in1', jobs: [{copyTo: 'out1'}]},
            {name: 'in2', jobs: [{copyTo: 'out1'}]}
        ]
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.out1.length, 4)
        assert.strictEqual(collections.out1[0].f1, 'in1-o1-f1')
        assert.strictEqual(collections.out1[1].f1, 'in1-o2-f1')
        assert.strictEqual(collections.out1[2].f1, 'in2-o1-f1')
        assert.strictEqual(collections.out1[3].f1, 'in2-o2-f1')
    })
})

describe('test cloneObjects', () => {
    it('test', () => {
        const config = {
            name: 'in3',
            jobs: [{
                cloneObjects: {field: 'f1', filter: ['in3-o1-f1', 'in3-o4-f1'], values: ['clone1', 'clone2']}
            }]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in3.length, 6 + 2 + 2)
    })

    it('test filter and values from collection', () => {
        const config = {
            name: 'in3',
            jobs: [{
                cloneObjects: {field: 'f1', filter: 'filter', values: ['clone1', 'clone2']}
            }]
        }
        let collections = newCollections()
        collections['filter'] = ['in3-o1-f1', 'in3-o4-f1']
        collections['values'] = ['clone1', 'clone2']
        m.map(config, collections)
        assert.strictEqual(collections.in3.length, 6 + 2 + 2)
    })
})

describe('test filterObjects', () => {
    it('test include', () => {
        const config = {
            name: 'in3',
            jobs: [{
                filterObjects: [
                    {field: 'f1', include: ['in3-o1-f1', 'in3-o4-f1']},
                    {field: 'f2', include: ['in3-o1-f2', 'in3-o3-f2']}
                ]
            }]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in3.length, 1)
    })

    it('test exclude', () => {
        const config = {
            name: 'in3',
            jobs: [{
                filterObjects: [
                    {field: 'f1', exclude: ['in3-o1-f1', 'in3-o4-f1']}
                ]
            }]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in3.length, 4)
    })

    it('test include from collections', () => {
        const config = {
            name: 'in3',
            jobs: [{
                filterObjects: [
                    {field: 'f1', include: 'f1-include'},
                    {field: 'f2', include: 'f2-include'}
                ]
            }]
        }
        let collections = newCollections()
        collections['f1-include'] = ['in3-o1-f1', 'in3-o4-f1']
        collections['f2-include'] = ['in3-o1-f2', 'in3-o3-f2']
        m.map(config, collections)
        assert.strictEqual(collections.in3.length, 1)
    })

    it('test exclude from collections', () => {
        const config = {
            name: 'in3',
            jobs: [{
                filterObjects: [
                    {field: 'f1', exclude: 'f1-exclude'}
                ]
            }]
        }
        let collections = newCollections()
        collections['f1-exclude'] = ['in3-o1-f1', 'in3-o4-f1']
        m.map(config, collections)
        assert.strictEqual(collections.in3.length, 4)
    })

})

describe('test filterFields', () => {
    it('test include', () => {
        const config = {
            name: 'in4',
            jobs: [{filterFields: {include: ['f1', 'f3']}}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in4[0].f1, 'in4-o1-f1')
        assert.strictEqual(collections.in4[0].f2, undefined)
        assert.strictEqual(collections.in4[0].f3, 'in4-o1-f3')
    })

    it('test exclude', () => {
        const config = {
            name: 'in4',
            jobs: [{filterFields: {exclude: ['f1', 'f3']}}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in4[0].f1, undefined)
        assert.strictEqual(collections.in4[0].f2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f3, undefined)

    })
    it('test include from collections', () => {
        const config = {
            name: 'in4',
            jobs: [{filterFields: {include: 'array1'}}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in4[0].f1, 'in4-o1-f1')
        assert.strictEqual(collections.in4[0].f2, undefined)
        assert.strictEqual(collections.in4[0].f3, 'in4-o1-f3')
    })

    it('test exclude from collection', () => {
        const config = {
            name: 'in4',
            jobs: [{filterFields: {exclude: 'array1'}}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in4[0].f1, undefined)
        assert.strictEqual(collections.in4[0].f2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f3, undefined)

    })
})

describe('test mapFields', () => {
    it('test', () => {
        const config = {
            name: 'in4', jobs: [{mapFields: [{from: 'f2', to: 's2'}]}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in4[0].f1, 'in4-o1-f1')
        assert.strictEqual(collections.in4[0].f2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].s2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f3, 'in4-o1-f3')
    })

    it('test from collections', () => {
        const config = {
            name: 'in4', jobs: [{mapFields: 'map1'}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in4[0].f1, 'in4-o1-f1')
        assert.strictEqual(collections.in4[0].f2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].s2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f3, 'in4-o1-f3')
    })

    it('test copy', () => {
        const config = {
            name: 'in4', jobs: [{
                mapFields: [
                    {from: 'f2', to: 'f2copy1', copy: true},
                    {from: 'f2', to: 'f2copy2', copy: true}
                ]
            }]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.in4[0].f1, 'in4-o1-f1')
        assert.strictEqual(collections.in4[0].f2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f3, 'in4-o1-f3')
        assert.strictEqual(collections.in4[0].f2copy1, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f2copy2, 'in4-o1-f2')
    })
})

describe('test mapValues', () => {
    // we need the same results in both tests
    const assertCollections = function (collections) {
        // first unchanged
        assert.strictEqual('in4-o1-f1', collections.in4[0].f1)
        assert.strictEqual('in4-o1-f2', collections.in4[0].f2)
        assert.strictEqual('in4-o1-f3', collections.in4[0].f3)
        // second changed f2 and f3
        assert.strictEqual('in4-o2-f1', collections.in4[1].f1)
        assert.strictEqual('changed-f2', collections.in4[1].f2)
        assert.strictEqual('changed-f3', collections.in4[1].f3)
    }

    it('test field/from/to', () => {
        const config = {
            name: 'in4', jobs: [{
                mapValues: [
                    {field: 'f2', from: 'in4-o2-f2', to: 'changed-f2'},
                    {field: 'f3', from: 'in4-o2-f3', to: 'changed-f3'}
                ]
            }]
        }
        let collections = newCollections()
        m.map(config, collections)
        assertCollections(collections)
    })
    it('test map', () => {
        const config = {
            name: 'in4', jobs: [{
                mapValues: [
                    {map: 'o.f2 = o.f2==="in4-o2-f2"?"changed-f2":o.f2; o.f3 = o.f3==="in4-o2-f3"?"changed-f3":o.f3'}
                ]
            }]
        }
        let collections = newCollections()
        m.map(config, collections)
        assertCollections(collections)
    })
})

describe('test copyToArray', () => {
    it('test', () => {
        const config = {
            name: 'in1', jobs: [{copyToArray: {copyTo: 'array', field: 'f1'}}]
        }
        let collections = newCollections()
        m.map(config, collections)
        assert.strictEqual(collections.array.length, 2)
        assert.strictEqual(collections.array[0], 'in1-o1-f1')
    })
})

describe('test mergeObjects', () => {
    const mergeObjectsCollections = function () {
        return {
            in5a: [//key                             key
                {f1: 'in5a-o1-f1', f2: 'in5a-o1-f2', f3: 'in5-o1-f3', f4: 'in5a-o1-f4', f5a: 'in5a-o1-f5a'},
                //                merge                              merge
                {f1: 'in5-o2-f1', f2: 'in5a-o2-f2', f3: 'in5-o2-f3', f4: 'in5a-o2-f4a', f5a: 'in5a-o2-f5a'},
                //                merge                              merge
                {f1: 'in5-o3-f1', f2: 'in5a-o3-f2', f3: 'in5-o3-f3', f4: 'in5a-o3-f4a', f5a: 'in5a-o3-f5a'},
                {f1: 'in5-o4-f1', f2: 'in5a-o4-f2', f3: 'in5a-o4-f3', f4: 'in5a-o4-f4', f5a: 'in5a-o4-f5a'}
            ],
            in5b: [
                // ignore (in non strict add new row)
                {f1: 'in5b-o1-f1', f2: 'in5b-o1-f2', f3: 'in5-o1-f3', f4: 'in5b-o1-f4', f5b: 'in5b-o1-f5b'},
                // merge with in5a[1]
                {f1: 'in5-o2-f1', f2: 'in5b-o2-f2', f3: 'in5-o2-f3', f4: 'in5b-o2-f4', f5b: 'in5b-o2-f5b'},
                // merge with in5a[2]
                {f1: 'in5-o3-f1', f2: 'in5b-o3-f2', f3: 'in5-o3-f3', f4: 'in5b-o3-f4', f5b: 'in5b-o3-f5b'},
                // ignore (in non strict add new row)
                {f1: 'in5-o4-f1', f2: 'in5b-o4-f2', f3: 'in5b-o4-f3', f4: 'in5b-o4-f4', f5b: 'in5b-o4-f5b'}
            ]
        }
    }

    const assert4Rows = function (collections) {
        // first unchanged
        // second merged
        // third merged
        // fourth unchanged
        assert.strictEqual(collections.in5a[0].f1, 'in5a-o1-f1')
        assert.strictEqual(collections.in5a[0].f2, 'in5a-o1-f2')
        assert.strictEqual(collections.in5a[0].f3, 'in5-o1-f3')
        assert.strictEqual(collections.in5a[0].f4, 'in5a-o1-f4')
        assert.strictEqual(collections.in5a[0].f5a, 'in5a-o1-f5a')
        assert.strictEqual(collections.in5a[1].f1, 'in5-o2-f1')
        assert.strictEqual(collections.in5a[1].f2, 'in5b-o2-f2')
        assert.strictEqual(collections.in5a[1].f3, 'in5-o2-f3')
        assert.strictEqual(collections.in5a[1].f4, 'in5b-o2-f4')
        assert.strictEqual(collections.in5a[1].f5a, 'in5a-o2-f5a')
        assert.strictEqual(collections.in5a[1].f5b, 'in5b-o2-f5b')
        assert.strictEqual(collections.in5a[2].f1, 'in5-o3-f1')
        assert.strictEqual(collections.in5a[2].f2, 'in5b-o3-f2')
        assert.strictEqual(collections.in5a[2].f3, 'in5-o3-f3')
        assert.strictEqual(collections.in5a[2].f4, 'in5b-o3-f4')
        assert.strictEqual(collections.in5a[2].f5a, 'in5a-o3-f5a')
        assert.strictEqual(collections.in5a[2].f5b, 'in5b-o3-f5b')
        assert.strictEqual(collections.in5a[3].f1, 'in5-o4-f1')
        assert.strictEqual(collections.in5a[3].f2, 'in5a-o4-f2')
        assert.strictEqual(collections.in5a[3].f3, 'in5a-o4-f3')
        assert.strictEqual(collections.in5a[3].f4, 'in5a-o4-f4')
        assert.strictEqual(collections.in5a[3].f5a, 'in5a-o4-f5a')
    }
    it('test strict', () => {
        const config = {
            name: 'in5a', jobs: [{mergeObjects: {name: 'in5b', key: ['f1', 'f3'], strict: true}}]
        }
        let collections = mergeObjectsCollections()
        m.map(config, collections)
        assert.strictEqual(4, collections.in5a.length)
        assert4Rows(collections)
    })

    it('test non strict (add not matched rows of second collection)', () => {
        const config = {
            name: 'in5a', jobs: [{mergeObjects: {name: 'in5b', key: ['f1', 'f3']}}]
        }
        let collections = mergeObjectsCollections()
        m.map(config, collections)
        assert.strictEqual(6, collections.in5a.length)
        assert4Rows(collections)
        // 5th and 6th are from col2[0] and col2[3] (the unmatched ones)
        assert.strictEqual(collections.in5a[4].f1, 'in5b-o1-f1')
        assert.strictEqual(collections.in5a[4].f2, 'in5b-o1-f2')
        assert.strictEqual(collections.in5a[4].f3, 'in5-o1-f3')
        assert.strictEqual(collections.in5a[4].f4, 'in5b-o1-f4')
        assert.strictEqual(collections.in5a[4].f5b, 'in5b-o1-f5b')

        assert.strictEqual(collections.in5a[5].f1, 'in5-o4-f1')
        assert.strictEqual(collections.in5a[5].f2, 'in5b-o4-f2')
        assert.strictEqual(collections.in5a[5].f3, 'in5b-o4-f3')
        assert.strictEqual(collections.in5a[5].f4, 'in5b-o4-f4')
        assert.strictEqual(collections.in5a[5].f5b, 'in5b-o4-f5b')
    })
})

describe('test aggregate', () => {
    /**
     * will generate
     * [
     *   { sex: 'male', name: [ 'Alex', 'Jim', 'George' ] },
     *   { sex: 'female', name: [ 'Mary' ] }
     * ]
     */
    it('test', () => {
        const collections = {
            humans: [
                {name: 'Alex', sex: 'male'},
                {name: 'Jim', sex: 'male'},
                {name: 'George', sex: 'male'},
                {name: 'Mary', sex: 'female'}
            ]
        }
        const config = {
            name: 'humans',
            jobs: [{aggregate: {name: 'humansBySex', aggregatedField: 'name', aggregationField: 'sex'}}]
        }
        m.map(config, collections)
        assert.strictEqual(2, collections.humansBySex.length)
        assert.strictEqual('male', collections.humansBySex[0].sex)
        assert.strictEqual(3, collections.humansBySex[0].name.length)
        assert.strictEqual('female', collections.humansBySex[1].sex)
        assert.strictEqual(1, collections.humansBySex[1].name.length)
    })

    it('test list', () => {
        /**
         * [
         * { tag: 'athlete', name: [ 'Alex', 'Jim' ] },
         * { tag: 'male', name: [ 'Alex', 'Jim', 'George' ] },
         * { tag: 'young', name: [ 'Alex' ] },
         * { tag: 'Greek', name: [ 'Alex', 'Jim', 'George', 'Mary' ] },
         * { tag: 'poet', name: [ 'Alex' ] },
         * { tag: 'old', name: [ 'Jim', 'George', 'Mary' ] },
         * { tag: 'motorbike driver', name: [ 'George' ] },
         * { tag: 'female', name: [ 'Mary' ] },
         * { tag: 'housewife', name: [ 'Mary' ] }
         * ]
         */
        const collections = {
            humans: [
                {name: 'Alex', tag: ['athlete', 'male', 'young', 'Greek', 'poet']},
                {name: 'Jim', tag: ['athlete', 'male', 'old', 'Greek']},
                {name: 'George', tag: ['male', 'old', 'Greek', 'motorbike driver']},
                {name: 'Mary', tag: ['female', 'old', 'Greek', 'housewife']},
            ]
        }
        const config = {
            name: 'humans',
            jobs: [{aggregate: {name: 'tags', aggregatedField: 'name', aggregationField: 'tag'}}]
        }
        m.map(config, collections)
        assert.strictEqual(9, collections.tags.length)
        assert.strictEqual('athlete', collections.tags[0].tag)
        assert.strictEqual(2, collections.tags[0].name.length)
        assert.strictEqual('male', collections.tags[1].tag)
        assert.strictEqual(3, collections.tags[1].name.length)
        assert.strictEqual('young', collections.tags[2].tag)
        assert.strictEqual(1, collections.tags[2].name.length)
        assert.strictEqual('Greek', collections.tags[3].tag)
        assert.strictEqual(4, collections.tags[3].name.length)
        assert.strictEqual('poet', collections.tags[4].tag)
        assert.strictEqual(1, collections.tags[4].name.length)
        assert.strictEqual('old', collections.tags[5].tag)
        assert.strictEqual(3, collections.tags[5].name.length)
        assert.strictEqual('motorbike driver', collections.tags[6].tag)
        assert.strictEqual(1, collections.tags[6].name.length)
        assert.strictEqual('female', collections.tags[7].tag)
        assert.strictEqual(1, collections.tags[7].name.length)
        assert.strictEqual('housewife', collections.tags[8].tag)
        assert.strictEqual(1, collections.tags[8].name.length)
    })
})


const assert = require('assert')
const m = require('..')

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
        ]
    }
}

describe('test copyTo', () => {
    it('single collection', () => {
        const config = {
            in1: {copyTo: 'out1'}
        }
        let collections = newCollections()
        m.map(collections, config)
        assert.strictEqual(collections.out1.length, 2)
        assert.strictEqual(collections.out1[0].f1, 'in1-o1-f1')
        assert.strictEqual(collections.out1[1].f1, 'in1-o2-f1')
    })

    it('multiple collections', () => {
        const config = {
            in1: {copyTo: 'out1'},
            in2: {copyTo: 'out1'}
        }
        let collections = newCollections()
        m.map(collections, config)
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
            in3: {
                cloneObjects: {
                    f1: {
                        filter: ['in3-o1-f1', 'in3-o4-f1'],
                        values: ['clone1', 'clone2']
                    }
                }
            }
        }
        let collections = newCollections()
        m.map(collections, config)
        assert.strictEqual(collections.in3.length, 6 + 2 + 2)
    })
})

describe('test filterObjects', () => {
    it('test include', () => {
        const config = {
            in3: {
                filterObjects: {
                    f1: {
                        include: ['in3-o1-f1', 'in3-o4-f1']
                    },
                    f2: {
                        include: ['in3-o1-f2', 'in3-o3-f2']
                    }
                }
            }
        }
        let collections = newCollections()
        m.map(collections, config)
        assert.strictEqual(collections.in3.length, 1)
    })

    it('test exclude', () => {
        const config = {
            in3: {
                filterObjects: {
                    f1: {
                        exclude: ['in3-o1-f1', 'in3-o4-f1']
                    }
                }
            }
        }
        let collections = newCollections()
        m.map(collections, config)
        assert.strictEqual(collections.in3.length, 4)
    })
})

describe('test filterFields', () => {
    it('test include', () => {
        const config = {
            in4: {
                filterFields: {
                    include: ['f1', 'f3']
                }
            }
        }
        let collections = newCollections()
        m.map(collections, config)
        assert.strictEqual(collections.in4[0].f1, 'in4-o1-f1')
        assert.strictEqual(collections.in4[0].f2, undefined)
        assert.strictEqual(collections.in4[0].f3, 'in4-o1-f3')
    })

    it('test exclude', () => {
        const config = {
            in4: {
                filterFields: {
                    exclude: ['f1', 'f3']
                }
            }
        }
        let collections = newCollections()
        m.map(collections, config)
        assert.strictEqual(collections.in4[0].f1, undefined)
        assert.strictEqual(collections.in4[0].f2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f3, undefined)
    })
})

describe('test mapFields', () => {
    it('test', () => {
        const config = {
            in4: {
                mapFields: {
                    f2: 's2'
                }
            }
        }
        let collections = newCollections()
        m.map(collections, config)
        assert.strictEqual(collections.in4[0].f1, 'in4-o1-f1')
        assert.strictEqual(collections.in4[0].f2, undefined)
        assert.strictEqual(collections.in4[0].s2, 'in4-o1-f2')
        assert.strictEqual(collections.in4[0].f3, 'in4-o1-f3')
    })
})

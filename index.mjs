import * as R from 'ramda'

const files = []

const doit = [
    {
        currentName: 'fa123.md',
        newName: 'solaranlage.md',
    },
]

const nameMapping = {
    fa123: 'solaranlage',
}

////////////////////////////////////////////////////////////////////////////////
// init
////////////////////////////////////////////////////////////////////////////////
let problems = []

////////////////////////////////////////////////////////////////////////////////
// helper
////////////////////////////////////////////////////////////////////////////////

const getContent = (fName) => ['line1', 'line2']

const logUnary = R.unary(console.log)
const isNotNil = R.complement(R.isNil)

////////////////////////////////////////////////////////////////////////////////
// process
////////////////////////////////////////////////////////////////////////////////

// all files: create new file name `newName` by sanetizing heading
console.log(`compute new file names`)
const filesWithNewNames = R.filter(
    isNotNil,
    files.map((file) => {
        const nextFile = {
            currentName: file.name,
        }
        console.log(`    ${file.name}`)
        const firstHeading = getFirstHeading(getContent(file.name))

        if (!firstHeading) {
            console.log(`        no first heading found!`)
            return undefined
        }

        const newName = firstHeading.toLowerCase() // TODO and other shit
        console.log(`        => ${newName}`)
        return {
            ...nextFile,
            newName,
        }
    })
)

//

//

//

//

//

// output problems
console.log(`Problems (${problems.length}):`)
problems.forEach(logUnary)

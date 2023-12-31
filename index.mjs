import * as R from 'ramda'

const files = []

const doit = [
    {
        currentName: 'fa123.md',
        newName: 'solaranlage.md',
    },
]

////////////////////////////////////////////////////////////////////////////////
// init
////////////////////////////////////////////////////////////////////////////////
let problems = []
const nameMapping = {}

////////////////////////////////////////////////////////////////////////////////
// helper
////////////////////////////////////////////////////////////////////////////////

const logUnary = R.unary(console.log)
const isNotNil = R.complement(R.isNil)
const emptyToUndefined = R.ifElse(R.isEmpty, R.always(undefined), R.identity)

const getContent = (fName) => ['line1', 'line2']
const getFirstHeading = R.pipe(R.filter(R.startsWith('#')), emptyToUndefined)

////////////////////////////////////////////////////////////////////////////////
// process
////////////////////////////////////////////////////////////////////////////////

// all files: create new file name `newName` by sanetizing heading
console.log(`compute new file names`)
R.filter(
    isNotNil,
    files.map((file) => {
        const nextFile = {
            currentName: file.name,
        }
        console.log(`    ${file.name}`)
        const firstHeading = getFirstHeading(getContent(file.name))

        if (!firstHeading) {
            const problem = 'no first heading found!'
            console.log(`        ${problem}`)
            problems.push({
                ...nextFile,
                problem,
            })
            return undefined
        }

        const newName = firstHeading.toLowerCase() // TODO and other shit
        console.log(`        => ${newName}`)
        nameMapping[file.name] = newName
        return {
            ...nextFile,
            newName,
        }
    })
)

// replace hierarchy and links

//

//

//

//

// output problems
console.log(`Problems (${problems.length}):`)
problems.forEach(logUnary)

console.log('hello world')

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

const logUnary = (a) => console.log(a)

////////////////////////////////////////////////////////////////////////////////
// process
////////////////////////////////////////////////////////////////////////////////

// all files: create new file name `newName` by sanetizing heading
doit = files.map((file) => {
    const nextFile = {
        currentName: file.name,
    }
    const newName = file.name.toLowerCase() // TODO and other shit
    const firstHeading = getFirstHeading()

    if (!firstHeading) {
        problems.push({
            ...nextFile,
            problem: 'no first heading',
        })
        return undefined
    }

    return {
        ...nextFile,
        newName,
    }
})

//

//

//

//

//

// output problems
console.log(`Problems (${problems.length}):`)
problems.forEach(logUnary)

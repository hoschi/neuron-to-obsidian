/* global cd, glob, fs, path, argv */
import * as R from 'ramda'
import replaceInFile from 'replace-in-file'
const { replaceInFileSync } = replaceInFile
import 'zx/globals'
import isValidFilename from 'valid-filename'
import { stringSimilarity } from 'string-similarity-js'

const neuronVault = path.resolve(argv._[0])
const OBSIDIAN_VAULT = '/Users/hoschi/Dropbox/obsidian-test/test/'
cd(OBSIDIAN_VAULT)
const obsidianFiles = await glob('*.md')

cd(neuronVault)
//const files = R.take(5, await glob('*.md'))
const files = await glob('*.md')

// todo
// - hab ich down richtig gemacht mit ?cf?
////////////////////////////////////////////////////////////////////////////////
// cleanup
////////////////////////////////////////////////////////////////////////////////
console.log(`
Make sure:
* enable simililar name checking below, see TODO
* search for \`rg '<z:zettels'\` and replace it with tag queries
* run script with \`npr real > output.txt\`
* make commit in obsidian vault
* copy all files from 'neu/' to the obsidian vault
* check with \`git status\` for changed files, restore them and merge manually!
* Search for angle bracket links with \`rg '<[a-zA-Z]+'\` in 'neu/' and replace them according to the renamed file
* make commit in obsidian vault
* check hierarchy
* make commit in obsidian vault
* install and configure YAML plugin to put the "date created" in all missing files https://platers.github.io/obsidian-linter/settings/yaml-rules/#yaml-timestamp
* make commit in obsidian vault
* switch back from special git branches to master and push in obsidian vault
`)

////////////////////////////////////////////////////////////////////////////////
// init
////////////////////////////////////////////////////////////////////////////////
let problems = []
const fileMap = {}

////////////////////////////////////////////////////////////////////////////////
// helper
////////////////////////////////////////////////////////////////////////////////

const logUnary = R.unary(console.log)
const emptyToUndefined = R.ifElse(R.isEmpty, R.always(undefined), R.identity)

const getContent = (fName) => fs.readFileSync(fName, 'utf8').toString().split('\n')
const getFirstHeading = R.pipe(R.filter(R.startsWith('#')), R.head, emptyToUndefined)
const removeFileExtensionMd = R.pipe(R.splitAt(-3), R.head)
const replace = R.pipe(
    R.assoc('countMatches', true),
    replaceInFileSync,
    R.filter(R.propEq(true, 'hasChanged')),
    R.map(
        ({ file: fName, numMatches, numReplacements }) =>
            `        ${fName} with ${numMatches}/${numReplacements} changes`
    ),
    R.forEach(logUnary)
)

////////////////////////////////////////////////////////////////////////////////
// process
////////////////////////////////////////////////////////////////////////////////

console.log(`compute new file names`)
files.forEach((fName) => {
    console.log(`    ${fName}`)
    const content = getContent(fName)
    let nextFile = {
        currentName: fName,
        hash: removeFileExtensionMd(fName),
    }
    const firstHeading = getFirstHeading(content)

    if (!firstHeading) {
        const problem = 'no first heading found!'
        console.log(`        ${problem}`)
        problems.push({
            ...nextFile,
            problem,
        })
        return undefined
    }

    const newName = R.pipe(R.tail, R.trim, R.toLower, R.replace(/(:|\\|\/)/g, '-'))(firstHeading)
    const newNameWithExtension = `${newName}.md`
    console.log(`        => ${newName}`)
    const check = (pred) => (lastWasProblem) => {
        if (lastWasProblem) {
            return lastWasProblem
        }
        const hasProblem = pred()
        if (hasProblem) {
            console.log(`        ${hasProblem}`)
            problems.push({
                ...nextFile,
                problem: hasProblem,
                newName,
                newNameWithExtension,
            })
            return true
        } else {
            return false
        }
    }

    R.pipe(
        check(() => !isValidFilename(newName) && `no valid file name: "${newName}"`),
        check(() => fileMap[newName] && `file already in map`),
        check(
            () =>
                fs.existsSync(path.join(OBSIDIAN_VAULT, newNameWithExtension)) &&
                `file already exists in Obsidian`
        ),

        check(() => {
            const similiarFiles = R.pipe(
                R.map((oFile) => ({
                    obsidianFile: oFile,
                    count: stringSimilarity(newNameWithExtension, oFile),
                })),
                // TODO disabled after all looked through
                R.filter(R.propSatisfies((x) => x > 1, 'count')),
                //R.filter(R.propSatisfies((x) => x > 0.7, 'count')),
                R.sort(R.descend(R.prop('count')))
            )(obsidianFiles)

            return (
                similiarFiles.length &&
                `simililar file aleardy exist?: ${R.pipe(
                    R.pluck('obsidianFile'),
                    R.join(', ')
                )(similiarFiles)}`
            )
        }),

        //check(() => ),
        check(() => {
            fileMap[nextFile.currentName] = {
                ...nextFile,
                newName,
                newNameWithExtension,
            }
            return false
        })
    )(false)
})

if (problems.length > 0) {
    console.log('********************ABORTED!********************')
    console.log(`Problems (${problems.length}):`)
    problems.forEach(logUnary)
    process.exit(1)
}

const fileNames = R.keys(fileMap)
console.log(`replace hierachy and links`)
R.forEach((currentName) => {
    const file = fileMap[currentName]
    console.log(`    ${file.newName} (${file.currentName})`)

    try {
        replace({
            files: fileNames,
            // eslint-disable-next-line no-useless-escape
            from: new RegExp(`\n(\\s*)\\S\\s<${file.hash}>`, 'g'),
            to: `\n$1* down:: [[${file.newName}]]`,
        })
        replace({
            files: fileNames,
            from: [new RegExp(`<${file.hash}>`, 'g'), new RegExp(`<${file.hash}\\?cf>`, 'g')],
            to: [`(down:: [[${file.newName}]])`, `[[${file.newName}]]`],
        })
    } catch (ex) {
        console.log(`        rif error: `, ex)
    }
}, fileNames)

console.log(`copy files over to new location`)
Promise.all(
    R.map((currentName) => {
        const file = fileMap[currentName]
        return fs.copy(
            path.join(neuronVault, file.currentName),
            path.join(OBSIDIAN_VAULT, file.newNameWithExtension),
            { preserveTimestamps: true }
        )
    }, fileNames)
)

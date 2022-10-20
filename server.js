const app = require('express')()
const axios = require('axios')

const PORT = process.env.PORT || 8181
const SWAPI_BASE = 'https://swapi.dev/api'


app.listen(PORT, () => console.log(`Listening on ${PORT}`))

let people = []
let planets = []
let planetPeople = []

function sortPeopleBy(sortByField, data) {
    return data.sort((a, b) => {
        switch(sortByField) {
            case 'name':
                return a[sortByField] > b[sortByField] ? 1 : b[sortByField] > a[sortByField] ? -1 : 0
            case 'height':
                return Number(a[sortByField]) < Number(b[sortByField]) ? 1 : Number(b[sortByField]) < Number(a[sortByField]) ? -1 : 0
            case 'mass':
                return Number(a[sortByField]) < Number(b[sortByField]) ? 1 : Number(b[sortByField]) < Number(a[sortByField]) ? -1 : 0
        }
    })
}

async function executeHttpGetPeople(url, res, sortByField) {
    await axios.get(url)
        .then(data => data.data)
        .then(result => {
            
            people = [...people, ...result.results]

            if(result.next) {
                executeHttpGetPeople(result.next, res, sortByField)
            } else {
                const sortedPeople = sortPeopleBy(sortByField, people)
                res.status(200).send(sortedPeople)
            }
        }).catch( error => console.warn('Error', error))
}

async function executeHttpGetPlanets(url, res) {
    await axios.get(url)
        .then(data => data.data)
        .then(async result => {
            planets = [...planets, ...result.results]

            if(result.next) {
                executeHttpGetPlanets(result.next, res)
            } else {
                const planetsWithPeople = planets.map(planet => {
                    const people = planet.residents.map(person => {
                        const p = planetPeople.find(fi => fi.url === person)
                        return { name: p ? p.name : 'unknown', url: person }
                    })

                    return {
                        ...planet,
                        residents: people
                    }
                })

                res.status(200).send(planetsWithPeople)
            }
        })
}

async function executeHttpGetPeopleForPlanets(url, response) {
    return await axios.get(url)
        .then(data => data.data)
        .then(result => {
            planetPeople = [...planetPeople, ...result.results]

            if(result.next) {
                executeHttpGetPeopleForPlanets(result.next, response)
            } else {
                executeHttpGetPlanets(`${SWAPI_BASE}/planets`, response)
            }
        })
}


app.get('/hello', (req, res) => {
    res.status(200).send({MSG: 'Hello, World'})
})

app.get('/people', async (req, res) => {
    sortBy = req.query.sortBy

    people = []
    await executeHttpGetPeople(`${SWAPI_BASE}/people`, res, sortBy)
})

app.get('/planets', async (req, response) => {
    planets = []

    await executeHttpGetPeopleForPlanets(`${SWAPI_BASE}/people`, response)
})



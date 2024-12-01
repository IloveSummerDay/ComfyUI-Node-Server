const express = require('express')
const userdb = require('../db/users')
const router = express.Router()

router.post('/signup', async (req, res, next) => {
    try {
        const dbres = await userdb.setUsers(req.body.client, req.body.pw)
        if (dbres.statusCode == 500) {
            next({
                api: req.originalUrl,
                method: req.method,
                ...dbres,
            })
        }
        res.send(dbres)
    } catch (error) {
        next({
            api: req.originalUrl,
            method: req.method,
            message: 'sign up error',
            error,
        })
    }
})

router.post('/login', async (req, res, next) => {
    try {
        const dbres = await userdb.getUsers(req.body.client, req.body.pw)
        if (dbres.statusCode == 500) {
            next({
                api: req.originalUrl,
                method: req.method,
                ...dbres,
            })
        }
        res.send(dbres)
    } catch (error) {
        next({
            api: req.originalUrl,
            method: req.method,
            message: 'login in error',
            error,
        })
    }
})

module.exports = router

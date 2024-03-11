const mongoose = require("mongoose");
const urlModel = require("../Model/urlModel");
const shortid = require("shortid");
const validUrl = require("valid-url");

const { promisify } = require("util");
const redis = require("redis");

// Create a Redis client
const redisClient = redis.createClient({
    url: "redis://default:Rz1TurwH5qG86UILEwG5QgYFPrwVMcTX@redis-18837.c10.us-east-1-3.ec2.cloud.redislabs.com:18837",
});

// Handle Redis client connection events
redisClient.on("connect", () => {
    console.log("Redis connection established");
});

redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});

// Promisify Redis SET and GET commands
const SET_ASYNC = promisify(redisClient.set).bind(redisClient); // Use lowercase set
const GET_ASYNC = promisify(redisClient.get).bind(redisClient); // Use lowercase get



const isvalid = function (data) {
    if (typeof (data) == undefined || typeof (data) == null) return false
    if (typeof (data) == "string" && data.trim().length == 0) return false
    if (typeof (data) === "number") return false
    return true
}

const urlShorten = async function (req, res) {
    try {
        let data = req.body
        let longUrl = data.longUrl
        if (Object.keys(data).length < 1) return res.status(400).send({ status: false, data: "empty body " })
        // console.log(Object.keys(data).length)

        // console.log(isvalid(longUrl))
        if (!isvalid(longUrl)) return res.status(400).send({ status: false, data: "provide longUrl in correct format" })
        if (Object.keys(data) != "longUrl") return res.status(400).send({ status: false, msg: "please provide longUrl keys " })
        // console.log(isvalid(longUrl))
        if (!validUrl.isUri(longUrl)) return res.status(400).send({ status: false, data: "invalid longUrl" })

        const cacheData = await GET_ASYNC(`${longUrl}`)
        if (cacheData) {
            console.log("cached..");
            return res.status(200).send({status: true, message: " url Already Exists in cache..",data: JSON.parse(cacheData),
            })
        }

        let findUrl = await urlModel.findOne({ longUrl: longUrl })
        if (findUrl) {
            await SET_ASYNC (`${findUrl.longUrl}`, JSON.stringify(findUrl))
            return res.status(200).send({ status: true, msg: "Url is already present in DB", data: findUrl })
        }

        let code = shortid.generate().trim().toLowerCase()
        let short = `https://project-full-stack-url-backend-1.onrender.com/${code}`

        let document = {
            longUrl: longUrl,
            shortUrl: short,
            urlCode: code
        }

        let saveData = await urlModel.create(document)
        console.log("long url "+ longUrl , saveData)
        await SET_ASYNC (`${longUrl}`, JSON.stringify(saveData))
        return res.status(201).send({ status: true, data: saveData })

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const getUrl = async function (req, res) {
    try {

        if (!shortid.isValid(req.params.urlCode)) return res.status(400).send({ status: false, message: 'Wrong UrlCode' })
        let urlCode = req.params.urlCode
        let cacheData = await GET_ASYNC(`${req.params.urlCode}`)

        if (cacheData) {
            console.log(cacheData)
            console.log("cache_data")
            return res.status(302).redirect(cacheData)
        }
        else {
            const url = await urlModel.findOne({ urlCode: urlCode })
            console.log("db call ....")
            if (!url) return res.status(404).send({ status: false, message: "url not found" })
            await SET_ASYNC(`${req.params.urlCode}`, url.longUrl)
            return res.status(302).redirect(url.longUrl);
        }

    }
    catch (err) {
        console.error(err)
        res.status(500).send({ status: false, message: err.message })
    }
}




module.exports = {
    urlShorten,
    getUrl
}
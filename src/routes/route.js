const express = require("express")
const router = express.Router()

const urlCode = require('../Controller/urlController')
const urlModel = require("../Model/urlModel")

router.get("/test-me",function(req,res){
    res.status(200).send({msg:"All ok"})
})

router.delete("/delete",async function(req,res){
  await urlModel.deleteMany()
})



router.post ('/url/shorten',urlCode.urlShorten)
router.get('/:urlCode',urlCode.getUrl)

router.all("/*", function (req, res) {
    res
      .status(404)
      .send({ status: false, msg: " please provide valid api " });
  });


module.exports = router;  

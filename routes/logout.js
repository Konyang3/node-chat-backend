module.exports = function (req, res) {
    req.logout(function(err) {
        if (err) { res.sendStatus(500); }
        res.sendStatus(200)
    })
}
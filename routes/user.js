module.exports = function (req, res) {
    console.log('/user 호출됨')

    console.log('req.user 객체의 값')
    console.dir(req.user);

    if (!req.user) {
        console.log('사용자 인증이 안된 상태임')
        res.sendStatus(403)
        return
    }

    console.log('사용자 인증된 상태임.');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({id: req.user.id, subjectCodes: req.user.subject_codes?.split(',')}))
}
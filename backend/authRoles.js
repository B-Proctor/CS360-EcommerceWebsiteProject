const ADMIN_ACCOUNTS = [ //TO ADD NEW ADMIN ACCOUNTS PUT THE EMAIL OF THE USER HERE! (MAKE SURE THAT THE EMAIL MATCHES SO Thre ARE NO accidents happening lmao)
    'test@gmail',
    'braydynproctor1@gmail.com',
    'noahwgerlach@gmail.com'
];

function isAdmin(email) {
    return ADMIN_ACCOUNTS.includes(email);
}

module.exports = { isAdmin };

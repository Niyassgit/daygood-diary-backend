export default () => ({
app:{
    port: parseInt(process.env.PORT ?? '3000',10),
},
database:{
    url: process.env.DATABASE_URL,
},
jwt:{
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
},
redis:{
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? '6379',10),
}
});
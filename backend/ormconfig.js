module.exports = {
   "type": "mysql",
   "host": process.env.DB_HOST || "localhost",
   "port": process.env.DB_PORT || 3306,
   "username": process.env.DB_USER || "root",
   "password": process.env.DB_PASS || "",
   "database": process.env.DB_NAME || "radio",
   "synchronize": true,
   "logging": false,
   "entities": [
      "src/entity/**/*.ts",
      "src/entity/**/*.js" // applies in built container
   ],
   "migrations": [
      "src/migration/**/*.ts",
      "src/migration/**/*.js" // applies in built container
   ],
   "subscribers": [
      "src/subscriber/**/*.ts",
      "src/subscriber/**/*.js" // applies in built container
   ],
   "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
   }
}

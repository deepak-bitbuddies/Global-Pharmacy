// Runs automatically on first container start (official mongo image executes
// every *.js in /docker-entrypoint-initdb.d/ against MONGO_INITDB_DATABASE).
// Mongoose also syncs these from the schema definitions at boot, but having
// them pre-created means they're in place from the very first request.
db = db.getSiblingDB("quick_commerce")

db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })

// Deferred along with their models: darkstores/orders/riderprofiles/
// customeraddresses 2dsphere indexes, storeinventories uniqueness index.
// Re-add here when those collections come back.

print("[mongo-init] user indexes created")

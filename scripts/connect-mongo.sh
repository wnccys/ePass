docker exec -it epass-mongo mongosh -u root -p secretpassword --authenticationDatabase admin epass_db
# ConnectionString: mongodb://root:secretpassword@localhost:27017/epass_db?authSource=admin
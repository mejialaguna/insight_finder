## Development
|steps| syntax|
|-----|-----|
| 1 - Clone repo | ```git clone -- https://github.com/mejialaguna/insight_finder.git``` |
| 2 - rename .envTemplate to .env and  change the env variables to your own | ```.envTemplate --> .env``` |
| 3 - install dependencies | ```npm install``` |
| 4 - create an account with mongo atlas  | ```https://cloud.mongodb.com/``` |
| 5 - create an new cluster and collection  | ```https://cloud.mongodb.com/``` |
| 5 - prisma migration | ```npx prisma generate``` |
| 6 - prisma migration | ```npm run seed`` |
| 7 - start dev server | ```npm run dev``` |

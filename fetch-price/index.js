import { MongoService } from "./service/mongo.js";
import { TokenPriceService } from "./service/tokenPriceService.js";

const start = async () => {
  const mongoService = new MongoService();
  const tokenPriceService = new TokenPriceService();

  await mongoService.connectMongo();
  
  await tokenPriceService.fetchPrice();
};

await start();

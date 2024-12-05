import { MongoService } from "./service/Mongo";
import { TokenPriceService } from "./service/TokenPriceService";

const start = async () => {
  const mongoService = new MongoService();
  const tokenPriceService = new TokenPriceService();

  await mongoService.connectMongo();
  await mongoService.initDb();

  await tokenPriceService.fetchPrice();
};

start();

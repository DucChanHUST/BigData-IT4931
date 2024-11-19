import { MongoService } from "./service/mongo.js";
import { TokenPriceService } from "./service/tokenPriceService.js";

const main = async () => {
  try {
    const monsoService = new MongoService();
    const tokenPriceService = new TokenPriceService();

    await monsoService.connectMongo();
    await monsoService.initDb();
    tokenPriceService.fetchPrice();
  } catch (error) {
    console.error("Error in main", error);
  }
};

main();

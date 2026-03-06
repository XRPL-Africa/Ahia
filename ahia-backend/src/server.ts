import app from "./app.js";
import dotenv from "dotenv";
import listingsRoutes from "./modules/listings/listings.routes";

dotenv.config({ override: true });
const PORT = process.env.PORT || 5000;
app.use("/api/listings", listingsRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
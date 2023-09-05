import { sequelize } from "../db/connection";
import { loadModels } from "../db/models";

(async () => {
  await loadModels();
  await sequelize.sync({ alter: true, logging: true });
})();

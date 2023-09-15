import { sequelize } from "../db/db";

export const syncModels = async (logging?: boolean) => {
  await sequelize.sync({ alter: true, logging: logging ?? false });
};
syncModels();

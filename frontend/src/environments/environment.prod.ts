import { envConfig } from './environment.prod.generated';

export const environment = {
  production: true,
  ...envConfig,
};

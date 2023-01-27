import swaggerJSDoc from 'swagger-jsdoc';
import { API_SCHEME, WORKER_API_BASE_URI, SWAGGER_DOMAIN } from './env';

const { description, version } = require('../../package.json');

const options = {
  swaggerDefinition: {
    info: {
      description,
      version,
      title: 'Fybapay API',
    },
    host: `${SWAGGER_DOMAIN}`,
    basePath: WORKER_API_BASE_URI,
    produces: ['application/json'],
    schemes: [API_SCHEME],
    securityDefinitions: {
      authToken: {
        type: 'apiKey',
        name: 'access_token',
        scheme: '',
        in: 'header',
      },
    },
    security: [{ authToken: [] }],
  },
  apis: ['./**/*.controller.js', './**/*.route.js', './**/*.model.js'],
};

const swaggerOptions = {
  customSiteTitle: 'Fybapay Api',
  customCss: '.topbar { display: none }',
  // customCssUrl: 'https://raw.githubusercontent.com/ostranme/swagger-ui-themes/develop/themes/3.x/theme-newspaper.css',
};

const spec = () => swaggerJSDoc(options);

export { spec, swaggerOptions };

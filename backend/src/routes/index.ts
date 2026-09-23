import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { meRouter } from '../modules/me/me.routes.js';
import { taxonomyRouter } from '../modules/taxonomy/taxonomy.routes.js';
import { productsRouter } from '../modules/products/products.routes.js';
import { vendorsRouter } from '../modules/vendors/vendors.routes.js';
import { ordersRouter } from '../modules/orders/orders.routes.js';

/**
 * All application routes hang off /api/v1. Versioning the prefix from day one
 * costs nothing now and avoids a painful migration once something is shipping
 * against a released contract.
 */
export const apiRouter: Router = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/me', meRouter);
apiRouter.use('/taxonomy', taxonomyRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/vendors', vendorsRouter);
apiRouter.use('/orders', ordersRouter);

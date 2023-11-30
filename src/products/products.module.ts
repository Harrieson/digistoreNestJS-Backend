import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import config from 'config';
import { StripeModule } from 'nestjs-stripe';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import { ProductRepository } from 'src/shared/repositories/product.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { ProductSchema, Products } from 'src/shared/schema/products';
import { UserSchema, Users } from 'src/shared/schema/users';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    UserRepository,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  imports: [
    MongooseModule.forFeature([{ name: Products.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    StripeModule.forRoot({
      apiKey: config.get('stripe.secret_key'),
      apiVersion: null,
    }),
  ],
})
export class ProductsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ProductsController);
  }
}

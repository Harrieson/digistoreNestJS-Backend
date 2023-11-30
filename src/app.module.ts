import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import config from 'config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionFilter } from './httpExceptionFilter';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    MongooseModule.forRoot(config.get('mongodbUrl'), {}),
    UsersModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_FILTER',
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule {}

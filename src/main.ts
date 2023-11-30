import { NestFactory } from '@nestjs/core';
import config from 'config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { TransformationInterceptor } from './responseInterceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(config.get('appPrefix'));
  app.use(cookieParser());
  app.useGlobalInterceptors(new TransformationInterceptor());
  await app.listen(config.get('port'), () => {
    console.log(`Server is running on port ${config.get('port')}`);
  });
}
bootstrap();

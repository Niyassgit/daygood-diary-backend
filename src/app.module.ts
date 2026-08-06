import {Module} from '@nestjs/common';
import {PrismaModule} from './prisma/prisma.module';
import {ConfigModule} from '@nestjs/config';
import configuration from './config/configuration';
import {envValidationSchema} from './config/env.validation';

@Module({
  imports: [
   ConfigModule.forRoot({
    isGlobal: true,
    cache: true,
    load:[configuration],
    validationSchema: envValidationSchema,
    }),
    
    PrismaModule
  ],
})
export class AppModule {}
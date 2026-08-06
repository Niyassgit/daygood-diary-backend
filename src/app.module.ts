import {Module} from '@nestjs/common';
import {PrismaModule} from './prisma/prisma.module';
import {ConfigModule} from '@nestjs/config';
import configuration from './config/configuration';
import {envValidationSchema} from './config/env.validation';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
   ConfigModule.forRoot({
    isGlobal: true,
    cache: true,
    load:[configuration],
    validationSchema: envValidationSchema,
    }),
    
    PrismaModule,
    
    RedisModule,
    
    UsersModule,
  ],
})
export class AppModule {}
import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
 private readonly redis:Redis;

  constructor(
    private readonly configService:ConfigService,
  ){
   
   this.redis = new Redis({
    host: this.configService.get<string>('redis.host'),
    port: this.configService.get<number>('redis.port'),
   });
  }
   
  async onModuleInit() {
    await this.redis.ping();
     console.log('✅ Redis Connected');
  }
 
  async onModuleDestroy() {
    await this.redis.quit();
  }
  getClient(): Redis {
    return this.redis;
  }
}
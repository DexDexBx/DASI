import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: pg.Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool, { disposeExternalPool: false });
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Prisma connected via PrismaPg driver adapter');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('PostgreSQL pool closed');
  }
}
